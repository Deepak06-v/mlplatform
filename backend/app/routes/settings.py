import logging
from datetime import datetime

from fastapi import APIRouter

from app.utils.db import settings_collection
from app.utils.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("")
def get_settings():
    doc = settings_collection.find_one({"_id": "user_prefs"})
    if not doc:
        return APIResponse.success({
            "ai_provider": "Auto",
            "ai_mode": "static",
            "ai_response_length": "Medium",
            "ai_caching": True,
            "default_problem_type": "auto",
            "cv_folds": 5,
            "eval_metric": "accuracy",
            "auto_scaling": True,
            "auto_selection": False,
            "random_seed": 42,
            "preview_rows": 10,
            "auto_detect_types": True,
            "auto_eda": False,
            "theme": "light",
            "accent_color": "indigo",
            "compact_mode": False,
            "animations": True,
            "sidebar_default": "expanded",
            "notifications": {
                "success": True,
                "warning": True,
                "error": True,
                "training": True,
                "ai_recommendation": True,
            },
            "landing_page": "/dashboard",
            "version": 1,
        })
    doc.pop("_id", None)
    return APIResponse.success(doc)


@router.put("")
def update_settings(payload: dict):
    payload.pop("_id", None)
    payload["updated_at"] = datetime.utcnow()
    if "version" not in payload:
        payload["version"] = 1
    settings_collection.update_one(
        {"_id": "user_prefs"},
        {"$set": payload},
        upsert=True,
    )
    doc = settings_collection.find_one({"_id": "user_prefs"})
    doc.pop("_id", None)
    return APIResponse.success(doc, "Settings updated")


@router.post("/reset")
def reset_settings():
    settings_collection.delete_one({"_id": "user_prefs"})
    return APIResponse.success({"reset": True}, "Settings reset to defaults")
