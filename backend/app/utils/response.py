"""Standardized API response handlers."""
import logging
from typing import Any, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)


class APIResponse:
    """Standardized API response builder."""
    
    @staticmethod
    def success(data: Any, message: str = "Success") -> dict:
        """Return successful response."""
        return {
            "status": "success",
            "message": message,
            "data": data
        }
    
    @staticmethod
    def error(detail: str, status_code: int = 400, error_type: str = "error") -> None:
        """Raise HTTP error with standard format."""
        logger.error(f"[{error_type}] {detail}")
        raise HTTPException(status_code=status_code, detail=detail)
    
    @staticmethod
    def validation_error(detail: str) -> None:
        """Raise validation error."""
        APIResponse.error(detail, status_code=400, error_type="validation_error")
    
    @staticmethod
    def not_found(resource: str) -> None:
        """Raise not found error."""
        APIResponse.error(f"{resource} not found", status_code=404, error_type="not_found")
    
    @staticmethod
    def server_error(detail: str, exception: Optional[Exception] = None) -> None:
        """Raise server error."""
        if exception:
            logger.exception(detail)
        APIResponse.error(detail, status_code=500, error_type="server_error")
