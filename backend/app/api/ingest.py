from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from sqlmodel import Session, select
from ..core.db import get_session
from ..core.hashing import calculate_sha256
from ..models.task import IngestionTask, TaskStatus
from ..worker.tasks import run_background_task
from ..services.pipeline import start_ingestion_pipeline
import os
import tempfile

router = APIRouter()


@router.post("/ingest", status_code=202)
async def ingest_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    content = await file.read()
    file_hash = calculate_sha256(content)

    # Check for existing task (idempotency)
    existing_task = session.exec(
        select(IngestionTask).where(IngestionTask.source_hash == file_hash)
    ).first()
    if existing_task:
        return {
            "task_id": existing_task.id,
            "status": existing_task.status,
            "message": "File already processed or in progress.",
        }

    # Create new task
    task = IngestionTask(source_hash=file_hash)
    session.add(task)
    session.commit()
    session.refresh(task)

    # Save file temporarily for processing
    temp_dir = tempfile.mkdtemp(prefix=f"ingest_{task.id}_")
    temp_path = os.path.join(temp_dir, file.filename)
    with open(temp_path, "wb") as f:
        f.write(content)

    # Trigger background pipeline
    background_tasks.add_task(
        run_background_task, start_ingestion_pipeline, str(task.id), temp_path
    )

    task_id = str(task.id)
    task_status = task.status
    task_progress = task.progress_pct

    return {"task_id": task_id, "status": task_status, "progress_pct": task_progress}


@router.get("/ingest/{task_id}")
async def get_task_status(task_id: str, session: Session = Depends(get_session)):
    from uuid import UUID

    try:
        uuid_id = UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")

    task = session.get(IngestionTask, uuid_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    response = {
        "task_id": task.id,
        "status": task.status,
        "progress_pct": task.progress_pct,
        "current_stage": task.current_stage,
        "eta_seconds": task.eta_seconds,
    }

    if task.status == TaskStatus.COMPLETE:
        response["manifest_url"] = f"/regulation/{task.id}"

    return response
