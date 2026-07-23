from datetime import datetime
from app.utils.db import ai_recommendations_collection


def get_recommendation(dataset_id: str, page: str, context_hash: str) -> dict:
    doc = ai_recommendations_collection.find_one(
        {
            "dataset_id": dataset_id,
            "page": page,
            "context_hash": context_hash
        },
        {"_id": 0}
    )
    return doc


def save_recommendation(dataset_id: str, page: str, data: dict) -> dict:
    now = datetime.utcnow()
    doc = {
        "dataset_id": dataset_id,
        "page": page,
        "context_hash": data.get("context_hash"),
        "provider": "google",
        "model": data.get("model", ""),
        "recommendation": data.get("data"),
        "generated_at": data.get("generated_at", now),
        "last_accessed": now,
        "version": 1
    }
    ai_recommendations_collection.update_one(
        {
            "dataset_id": dataset_id,
            "page": page,
            "context_hash": doc["context_hash"]
        },
        {"$set": {**doc, "updated_at": now}, "$setOnInsert": {"created_at": now}},
        upsert=True
    )
    return doc


def touch_recommendation(dataset_id: str, page: str, context_hash: str):
    ai_recommendations_collection.update_one(
        {
            "dataset_id": dataset_id,
            "page": page,
            "context_hash": context_hash
        },
        {"$set": {"last_accessed": datetime.utcnow()}}
    )


def delete_recommendations(dataset_id: str) -> int:
    result = ai_recommendations_collection.delete_many({"dataset_id": dataset_id})
    return result.deleted_count
