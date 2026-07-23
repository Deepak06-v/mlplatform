from datetime import datetime
from app.utils.db import dataset_sessions_collection


def get_session(dataset_id: str) -> dict:
    session = dataset_sessions_collection.find_one(
        {"dataset_id": dataset_id}, {"_id": 0}
    )
    return session


def upsert_session(dataset_id: str, data: dict) -> dict:
    now = datetime.utcnow()
    data.pop("dataset_id", None)
    update = {
        "$set": {**data, "updated_at": now},
        "$setOnInsert": {"created_at": now, "dataset_id": dataset_id}
    }
    dataset_sessions_collection.update_one(
        {"dataset_id": dataset_id},
        update,
        upsert=True
    )
    return get_session(dataset_id)


def patch_session(dataset_id: str, updates: dict) -> dict:
    updates.pop("dataset_id", None)
    updates["updated_at"] = datetime.utcnow()
    dataset_sessions_collection.update_one(
        {"dataset_id": dataset_id},
        {"$set": updates},
        upsert=True
    )
    return get_session(dataset_id)


def delete_session(dataset_id: str) -> bool:
    result = dataset_sessions_collection.delete_one({"dataset_id": dataset_id})
    return result.deleted_count > 0
