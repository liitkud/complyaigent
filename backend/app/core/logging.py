import logging
import sys

from .config import settings


def setup_logging():
    logging.basicConfig(
        level=settings.LOG_LEVEL,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    # purpose: error visibility as per constitution
    logger = logging.getLogger("governance_bridge")
    return logger


logger = setup_logging()
