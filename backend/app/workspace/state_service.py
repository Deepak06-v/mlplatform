from datetime import datetime, timezone

from bson import ObjectId

from app.utils.db import db as mongo_db
from app.utils.db import workspaces_collection

WORKSPACE_STATE_COLLECTION = "workspace_state"


def _collection():
    return mongo_db[WORKSPACE_STATE_COLLECTION]


def _ensure_state_doc(workspace_id: str) -> dict:
    doc = _collection().find_one({"_id": ObjectId(workspace_id)})
    if not doc:
        now = datetime.now(timezone.utc)
        doc = {
            "_id": ObjectId(workspace_id),
            "workspace_id": workspace_id,
            "dataset": None,
            "eda": None,
            "preprocessing": None,
            "training": None,
            "feature_importance": None,
            "ai_insights": None,
            "status": {
                "dataset_uploaded": False,
                "eda_computed": False,
                "feature_importance_computed": False,
                "models_trained": False,
                "ai_insights_generated": False,
            },
            "created_at": now,
            "updated_at": now,
        }
        try:
            _collection().insert_one(doc)
        except Exception:
            doc = _collection().find_one({"_id": ObjectId(workspace_id)})
    return doc


def get_full_state(workspace_id: str) -> dict | None:
    try:
        doc = _collection().find_one(
            {"_id": ObjectId(workspace_id)},
            {"_id": 0},
        )
        return doc
    except Exception:
        return _ensure_state_doc(workspace_id)


def get_section(workspace_id: str, section: str):
    try:
        doc = _collection().find_one(
            {"_id": ObjectId(workspace_id)},
            {section: 1, "_id": 0},
        )
        return doc.get(section) if doc else None
    except Exception:
        return None


def update_section(workspace_id: str, section: str, data, update_status: str = None):
    now = datetime.now(timezone.utc)
    set_fields = {section: data, "updated_at": now}
    if update_status:
        set_fields[f"status.{update_status}"] = True
    try:
        _collection().update_one(
            {"_id": ObjectId(workspace_id)},
            {"$set": set_fields},
            upsert=True,
        )
    except Exception:
        _ensure_state_doc(workspace_id)
        _collection().update_one(
            {"_id": ObjectId(workspace_id)},
            {"$set": set_fields},
        )


def update_sections(workspace_id: str, updates: dict):
    now = datetime.now(timezone.utc)
    set_fields = dict(updates)
    set_fields["updated_at"] = now
    try:
        _collection().update_one(
            {"_id": ObjectId(workspace_id)},
            {"$set": set_fields},
            upsert=True,
        )
    except Exception:
        _ensure_state_doc(workspace_id)
        _collection().update_one(
            {"_id": ObjectId(workspace_id)},
            {"$set": set_fields},
        )


def invalidate(workspace_id: str, triggers: list[str]):
    now = datetime.now(timezone.utc)
    unset_fields = {}
    status_resets = {}

    if "dataset" in triggers:
        unset_fields["eda"] = ""
        unset_fields["preprocessing"] = ""
        unset_fields["feature_importance"] = ""
        unset_fields["ai_insights"] = ""
        status_resets["status.eda_computed"] = False
        status_resets["status.feature_importance_computed"] = False
        status_resets["status.models_trained"] = False
        status_resets["status.ai_insights_generated"] = False

    if "preprocessing" in triggers:
        status_resets["status.models_trained"] = False

    if "retrain" in triggers:
        pass

    set_fields = {"updated_at": now}
    set_fields.update(status_resets)

    update = {}
    if unset_fields:
        update["$unset"] = unset_fields
    if set_fields:
        update["$set"] = set_fields
    if update:
        try:
            _collection().update_one(
                {"_id": ObjectId(workspace_id)},
                update,
            )
        except Exception:
            pass


def reset_state(workspace_id: str):
    try:
        _collection().delete_one({"_id": ObjectId(workspace_id)})
    except Exception:
        pass
