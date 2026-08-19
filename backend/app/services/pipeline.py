import asyncio
import os
from uuid import UUID

from sqlmodel import Session, col, select

from ..core.db import engine
from ..core.logging import logger
from ..models.rule import GovernanceRule
from ..models.task import IngestionTask, TaskStatus
from ..regintel.rag import VectorStoreConnection
from .categorizer import categorizer, validate_a1_rule
from .compactor import compactor
from .comparator import comparator
from .extractor import clean_text, extract_text_from_markdown, extract_text_from_pdf

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
    The worker owns retries, so failures are re-raised after task state is saved.
    """
    try:
        await asyncio.wait_for(_run_pipeline(task_id, file_path), timeout=60.0)
        if os.path.exists(file_path):
            os.remove(file_path)
    except TimeoutError:
        logger.error(f"Pipeline timed out after 60s for task {task_id}")
        with Session(engine) as session:
            task = session.get(IngestionTask, UUID(task_id))
            if task:
                task.status = TaskStatus.FAILED
                task.current_stage = "Error: Pipeline timed out after 60s"
                session.add(task)
                session.commit()
        raise
    except Exception as e:
        logger.error(f"Unexpected error in ingestion wrapper for task {task_id}: {e}")
        raise


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

            _link_policy_revision(session, task, cleaned_text)

            # Stage 3: Compactor
            await update_task_progress(session, task, "Compacting Requirements", 50)
            compacted_text = await compactor.compact_document(cleaned_text)

            # Stage 4: Categorizer
            await update_task_progress(session, task, "Categorizing Rules", 80)
            rules_data = await categorizer.categorize_rules(compacted_text)
            if not rules_data:
                raise ValueError("Categorizer returned zero rules")
            if rules_data:
                source_type = rules_data[0]["source_category"]
                task.source_type = getattr(source_type, "value", source_type)
                session.add(task)
                session.commit()

            # Per-rule insertion to prevent one bad rule from killing the batch
            stored_rules = []
            for r_data in rules_data:
                try:
                    if r_data.get("type") == "A1_SCANNABLE":
                        rejection = validate_a1_rule(r_data)
                        if rejection:
                            logger.warning(
                                "Discarding unsafe A1 rule for task %s: %s",
                                task_id,
                                rejection,
                            )
                            continue
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

            if not stored_rules:
                raise ValueError("Pipeline produced zero valid rules")

            # Stage 5: Vector Indexing (RAG)
            await update_task_progress(session, task, "Indexing rules for RAG", 95)
            if stored_rules:
                try:
                    rag_conn = VectorStoreConnection()
                    rag_conn.index_rules(stored_rules)
                except Exception as e:
                    logger.warning(f"RAG Indexing failed for task {task_id}: {e!s}")

            # Finalize
            task.status = TaskStatus.COMPLETE
            task.progress_pct = 100
            task.current_stage = "Complete"
            task.eta_seconds = 0
            session.add(task)
            session.commit()

        except Exception as e:
            logger.error(
                f"Pipeline failed at stage {task.current_stage} for task {task_id}: {e!s}"
            )
            task.status = TaskStatus.FAILED
            task.current_stage = f"Error in {task.current_stage}: {e!s}"
            session.add(task)
            session.commit()
            raise


def _link_policy_revision(session: Session, task: IngestionTask, text: str) -> None:
    """Attach a changed upload to the latest deterministic policy revision."""
    previous = session.exec(
        select(IngestionTask)
        .where(
            IngestionTask.source_name == task.source_name,
            IngestionTask.id != task.id,
        )
        .order_by(col(IngestionTask.version_number).desc())
    ).first()

    if not previous:
        anchors = comparator.extract_anchors(text)
        if anchors:
            existing_rule = session.exec(
                select(GovernanceRule)
                .where(col(GovernanceRule.content).like(f"%{anchors[0]}%"))
                .order_by(col(GovernanceRule.id))
            ).first()
            if existing_rule:
                previous = session.get(IngestionTask, existing_rule.task_id)

    if previous:
        task.policy_id = previous.policy_id
        task.previous_version_id = previous.id
        task.version_number = previous.version_number + 1
        task.version_chain = [
            *(previous.version_chain or [str(previous.id)]),
            str(task.id),
        ]
        session.add(task)
        session.commit()
