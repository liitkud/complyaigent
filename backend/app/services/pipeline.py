from ..models.task import IngestionTask, TaskStatus
from ..models.rule import GovernanceRule
from ..core.db import engine
from sqlmodel import Session, select, col
from ..core.logging import logger
from .extractor import extract_text_from_pdf, extract_text_from_markdown, clean_text
from .comparator import comparator
from .compactor import compactor
from .categorizer import categorizer
from ..regintel.rag import VectorStoreConnection
import os
from uuid import UUID

# Stage Averages (seconds)
STAGE_TIMINGS = {
    "Extracting Text": 2,
    "Running Comparator (Deduplication)": 3,
    "Compacting Requirements": 5,
    "Categorizing Rules": 10,
}


async def update_task_progress(session, task, stage, progress):
    task.current_stage = stage
    task.progress_pct = progress

    # Simple ETA: sum of remaining stages' averages
    remaining_stages = list(STAGE_TIMINGS.keys())
    try:
        current_index = remaining_stages.index(stage)
        task.eta_seconds = sum(list(STAGE_TIMINGS.values())[current_index:])
    except ValueError:
        task.eta_seconds = 0

    session.add(task)
    session.commit()


async def start_ingestion_pipeline(task_id: str, file_path: str):
    """
    Orchestrates the multi-stage intelligence pipeline.
    """
    with Session(engine) as session:
        task = session.get(IngestionTask, UUID(task_id))
        if not task:
            return

        try:
            # Stage 1: Extraction
            await update_task_progress(session, task, "Extracting Text", 10)

            if file_path.endswith(".pdf"):
                raw_text = extract_text_from_pdf(file_path)
            else:
                raw_text = extract_text_from_markdown(file_path)

            cleaned_text = clean_text(raw_text)

            # Stage 2: Comparator (Deduplication)
            await update_task_progress(
                session, task, "Running Comparator (Deduplication)", 30
            )

            # Tier 1: Anchors (Deduplication / Lineage)
            anchors = comparator.extract_anchors(cleaned_text)
            if anchors:
                # Search for existing rules with any of these anchors
                # This is a simplified lineage check for the MVP

                existing_rule = session.exec(
                    select(GovernanceRule).where(
                        col(GovernanceRule.content).like(f"%{anchors[0]}%")
                    )
                ).first()
                if existing_rule:
                    task.previous_version_id = existing_rule.task_id
                    # Load previous version chain
                    prev_task = session.get(IngestionTask, existing_rule.task_id)
                    if prev_task:
                        task.version_chain = prev_task.version_chain + [task.id]
                    else:
                        task.version_chain = [existing_rule.task_id, task.id]
                    session.add(task)
                    session.commit()
            await update_task_progress(session, task, "Compacting Requirements", 50)

            compacted_text = await compactor.compact_document(cleaned_text)

            # Stage 4: Categorizer
            await update_task_progress(session, task, "Categorizing Rules", 80)

            rules_data = await categorizer.categorize_rules(compacted_text)

            for r_data in rules_data:
                rule = GovernanceRule(
                    task_id=task.id,
                    type=r_data["type"],
                    impact_radius=r_data["impact_radius"],
                    risk_level=r_data["risk_level"],
                    source_category=r_data["source_category"],
                    content=r_data["content"],
                    remediation=r_data.get("remediation"),
                    tags=r_data.get("tags", []),
                    rule_metadata=r_data.get("metadata", {}),
                )
                session.add(rule)

            # Stage 5: Vector Indexing (RAG)
            await update_task_progress(session, task, "Indexing rules for RAG", 95)
            try:
                rag_conn = VectorStoreConnection()
                rules_to_index = [
                    obj for obj in session.new if isinstance(obj, GovernanceRule)
                ]
                rag_conn.index_rules(rules_to_index)
            except Exception as e:
                logger.warning(f"RAG Indexing failed: {str(e)}")

            # Finalize
            task.status = TaskStatus.COMPLETE
            task.progress_pct = 100
            task.current_stage = "Complete"
            task.eta_seconds = 0
            session.add(task)
            session.commit()

        except Exception as e:
            logger.error(f"Pipeline failed for task {task_id}: {str(e)}")
            task.status = TaskStatus.FAILED
            task.current_stage = f"Error: {str(e)}"
            session.add(task)
            session.commit()
        finally:
            # Cleanup temp file
            if os.path.exists(file_path):
                os.remove(file_path)
