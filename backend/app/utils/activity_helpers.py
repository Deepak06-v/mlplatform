from datetime import datetime
from app.utils.db import activities_collection


def create_activity(data: dict) -> dict:
    now = datetime.utcnow()
    doc = {**data, "created_at": now}
    result = activities_collection.insert_one(doc)
    doc.pop("_id", None)
    return doc


def get_activities(dataset_id: str) -> list:
    cursor = activities_collection.find(
        {"dataset_id": dataset_id},
        {"_id": 0}
    ).sort("created_at", -1)
    return list(cursor)


def delete_activities(dataset_id: str) -> int:
    result = activities_collection.delete_many({"dataset_id": dataset_id})
    return result.deleted_count
