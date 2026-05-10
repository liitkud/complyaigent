from typing import Callable, Any
from ..core.logging import logger


async def run_background_task(task_func: Callable[..., Any], *args, **kwargs):
    """
    Lightweight background task runner using asyncio.
    In a real MVP/Prod, this would be Celery or Arq.
    """
    task_name = getattr(task_func, "__name__", "unknown")
    try:
        logger.info(f"Starting background task: {task_name}")
        await task_func(*args, **kwargs)
        logger.info(f"Completed background task: {task_name}")
    except Exception as e:
        logger.error(f"Background task {task_name} failed: {str(e)}")
        # purpose: error visibility and resilience (retry logic would be handled by the service)
