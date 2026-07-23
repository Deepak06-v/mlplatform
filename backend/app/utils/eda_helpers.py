from datetime import datetime
from app.utils.db import eda_results_collection


def get_eda(dataset_id: str) -> dict:
    doc = eda_results_collection.find_one(
        {"dataset_id": dataset_id},
        {"_id": 0}
    )
    return doc


def save_eda(dataset_id: str, data: dict) -> dict:
    now = datetime.utcnow()
    doc = {
        "dataset_id": dataset_id,
        "data": data,
        "generated_at": now,
        "version": 1
    }
    eda_results_collection.update_one(
        {"dataset_id": dataset_id},
        {"$set": {**doc, "updated_at": now}, "$setOnInsert": {"created_at": now}},
        upsert=True
    )
    return doc


def delete_eda(dataset_id: str) -> int:
    result = eda_results_collection.delete_many({"dataset_id": dataset_id})
    return result.deleted_count
