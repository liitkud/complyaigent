import asyncio
import os
from collections.abc import Callable
from typing import Any

from ..core.logging import logger


async def run_background_task(
    task_func: Callable[..., Any],
    *args,
    max_attempts: int = 3,
    retry_delay: float = 0.0,
    **kwargs,
):
    """
    Lightweight background task runner using asyncio.
    In a real MVP/Prod, this would be Celery or Arq.
    """
    if not 1 <= max_attempts <= 3:
        raise ValueError("max_attempts must be between 1 and 3")

    task_name = getattr(task_func, "__name__", "unknown")
    for attempt in range(1, max_attempts + 1):
        try:
            logger.info(f"Starting background task {task_name} (attempt {attempt})")
            await task_func(*args, **kwargs)
            logger.info(f"Completed background task: {task_name}")
            return
        except Exception as e:
            if attempt == max_attempts:
                logger.error(
                    f"Background task {task_name} failed after {max_attempts} attempts: {e!s}"
                )
                _cleanup_file_argument(args)
                return

            logger.warning(
                f"Background task {task_name} attempt {attempt} failed: {e!s}. Retrying"
            )
            if retry_delay:
                await asyncio.sleep(retry_delay)


def _cleanup_file_argument(args: tuple[Any, ...]) -> None:
    """Remove a pipeline input after the worker has no attempts left."""
    for value in args:
        if isinstance(value, str) and os.path.isfile(value):
            os.remove(value)
