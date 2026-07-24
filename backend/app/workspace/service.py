from datetime import datetime, timezone

from app.utils.db import (
    activities_collection,
    ai_recommendations_collection,
    comparisons_collection,
    dataset_collection,
    dataset_sessions_collection,
    eda_results_collection,
    experiments_collection,
    feature_importance_collection,
    users_collection,
    workspaces_collection,
)
from app.storage.provider import storage_provider


def create_workspace(user_id: str) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "dataset_id": None,
        "status": "empty",
        "created_at": now,
        "updated_at": now,
    }
    result = workspaces_collection.insert_one(doc)
    workspace_id = str(result.inserted_id)
    doc["workspace_id"] = workspace_id
    return doc


def get_workspace(workspace_id: str) -> dict | None:
    from bson import ObjectId
    try:
        doc = workspaces_collection.find_one({"_id": ObjectId(workspace_id)})
    except Exception:
        return None
    if not doc:
        return None
    doc["workspace_id"] = str(doc.pop("_id"))
    return doc


def get_user_workspace(user_id: str) -> dict | None:
    from bson import ObjectId
    try:
        doc = workspaces_collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", 1)],
        )
    except Exception:
        return None
    if not doc:
        return None
    doc["workspace_id"] = str(doc.pop("_id"))
    return doc


def set_workspace_dataset(workspace_id: str, dataset_id: str) -> None:
    from bson import ObjectId
    now = datetime.now(timezone.utc)
    workspaces_collection.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$set": {"dataset_id": dataset_id, "status": "active", "updated_at": now}},
    )


def reset_workspace(workspace_id: str, user_id: str) -> dict:
    from bson import ObjectId
    ws = get_workspace(workspace_id)
    if not ws:
        return {"status": "error", "message": "Workspace not found"}

    old_dataset_id = ws.get("dataset_id")

    if old_dataset_id:
        dataset = dataset_collection.find_one({"dataset_id": old_dataset_id})
        if dataset:
            storage_key = dataset.get("storage_key")
            if storage_key:
                try:
                    storage_provider.delete(storage_key)
                except Exception:
                    pass

        dataset_collection.delete_one({"dataset_id": old_dataset_id})
        dataset_sessions_collection.delete_one({"dataset_id": old_dataset_id})
        experiments_collection.delete_many({"dataset_id": old_dataset_id})
        comparisons_collection.delete_one({"dataset_id": old_dataset_id})
        activities_collection.delete_many({"dataset_id": old_dataset_id})
        eda_results_collection.delete_many({"dataset_id": old_dataset_id})
        feature_importance_collection.delete_many({"dataset_id": old_dataset_id})
        ai_recommendations_collection.delete_many({"dataset_id": old_dataset_id})

    now = datetime.now(timezone.utc)
    workspaces_collection.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$set": {"dataset_id": None, "status": "empty", "updated_at": now}},
    )

    return {
        "workspace_id": workspace_id,
        "status": "empty",
        "message": "Workspace has been reset",
    }
