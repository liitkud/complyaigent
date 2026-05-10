import asyncio
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
    session.refresh(task)


async def start_ingestion_pipeline(task_id: str, file_path: str):
    """
    Orchestrates the multi-stage intelligence pipeline.
    Wraps everything in a 60s timeout and handles per-rule persistence.
    """
    try:
        await asyncio.wait_for(_run_pipeline(task_id, file_path), timeout=60.0)
    except asyncio.TimeoutError:
        logger.error(f"Pipeline timed out after 60s for task {task_id}")
        with Session(engine) as session:
            task = session.get(IngestionTask, UUID(task_id))
            if task:
                task.status = TaskStatus.FAILED
                task.current_stage = "Error: Pipeline timed out after 60s"
                session.add(task)
                session.commit()
    except Exception as e:
        logger.error(f"Unexpected error in ingestion wrapper for task {task_id}: {e}")
    finally:
        # Cleanup temp file
        if os.path.exists(file_path):
            os.remove(file_path)


async def _run_pipeline(task_id: str, file_path: str):
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

            anchors = comparator.extract_anchors(cleaned_text)
            if anchors:
                existing_rule = session.exec(
                    select(GovernanceRule).where(
                        col(GovernanceRule.content).like(f"%{anchors[0]}%")
                    )
                ).first()
                if existing_rule:
                    task.previous_version_id = existing_rule.task_id
                    prev_task = session.get(IngestionTask, existing_rule.task_id)
                    if prev_task:
                        task.version_chain = prev_task.version_chain + [task.id]
                    else:
                        task.version_chain = [existing_rule.task_id, task.id]
                    session.add(task)
                    session.commit()

            # Stage 3: Compactor
            await update_task_progress(session, task, "Compacting Requirements", 50)
            compacted_text = await compactor.compact_document(cleaned_text)

            # Stage 4: Categorizer
            await update_task_progress(session, task, "Categorizing Rules", 80)
            rules_data = await categorizer.categorize_rules(compacted_text)

            # Per-rule insertion to prevent one bad rule from killing the batch
            stored_rules = []
            for r_data in rules_data:
                try:
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
                    session.commit()  # Individual commit
                    session.refresh(rule)
                    stored_rules.append(rule)
                except Exception as rule_err:
                    session.rollback()
                    logger.warning(
                        f"Skipping malformed rule for task {task_id}: {rule_err}"
                    )

            # Stage 5: Vector Indexing (RAG)
            await update_task_progress(session, task, "Indexing rules for RAG", 95)
            if stored_rules:
                try:
                    rag_conn = VectorStoreConnection()
                    rag_conn.index_rules(stored_rules)
                except Exception as e:
                    logger.warning(f"RAG Indexing failed for task {task_id}: {str(e)}")

            # Finalize
            task.status = TaskStatus.COMPLETE
            task.progress_pct = 100
            task.current_stage = "Complete"
            task.eta_seconds = 0
            session.add(task)
            session.commit()

        except Exception as e:
            logger.error(
                f"Pipeline failed at stage {task.current_stage} for task {task_id}: {str(e)}"
            )
            task.status = TaskStatus.FAILED
            task.current_stage = f"Error in {task.current_stage}: {str(e)}"
            session.add(task)
            session.commit()
