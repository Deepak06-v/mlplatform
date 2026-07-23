import json
import logging
import time


def log_event(logger, event: str, **kwargs):
    record = {"event": event, "timestamp": time.time()}
    record.update(kwargs)
    logger.info(json.dumps(record, default=str))
