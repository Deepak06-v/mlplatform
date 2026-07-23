"""Standardized API response handlers."""
import logging
from typing import Any, Optional
from fastapi import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import Config

logger = logging.getLogger(__name__)


class APIResponse:
    @staticmethod
    def success(data: Any, message: str = "Success", from_cache: bool = False) -> dict:
        result = {
            "status": "success",
            "message": message,
            "data": data,
        }
        if from_cache:
            result["from_cache"] = True
        return result

    @staticmethod
    def error(
        detail: str,
        status_code: int = 400,
        error_type: str = "error",
    ) -> None:
        safe_detail = "Bad request" if (Config.is_production() and status_code >= 500) else detail
        logger.error("[%s] %s", error_type, detail)
        raise HTTPException(status_code=status_code, detail=safe_detail)

    @staticmethod
    def validation_error(detail: str) -> None:
        APIResponse.error(detail, status_code=400, error_type="validation_error")

    @staticmethod
    def not_found(resource: str) -> None:
        APIResponse.error(f"{resource} not found", status_code=404, error_type="not_found")

    @staticmethod
    def server_error(detail: str, exception: Optional[Exception] = None) -> None:
        if exception:
            logger.exception(detail)
        APIResponse.error(detail, status_code=500, error_type="server_error")
