from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..core.db import get_session
from ..services.logger import ActivityLog

router = APIRouter()


@router.get("/activity")
async def get_activity_stream(session: Session = Depends(get_session)):
    """
    Return the last 50 log entries for the pipeline stream.
    """
    from sqlmodel import col

    statement = (
        select(ActivityLog).order_by(col(ActivityLog.timestamp).desc()).limit(50)
    )
    logs = session.exec(statement).all()
    return logs
