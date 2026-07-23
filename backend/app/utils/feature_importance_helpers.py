from datetime import datetime
from app.utils.db import feature_importance_collection


def get_feature_importance(dataset_id: str, target_column: str, problem_type: str, model_used: str) -> dict:
    doc = feature_importance_collection.find_one(
        {
            "dataset_id": dataset_id,
            "target_column": target_column,
            "problem_type": problem_type,
            "model_used": model_used
        },
        {"_id": 0}
    )
    return doc


def save_feature_importance(dataset_id: str, target_column: str, problem_type: str, model_used: str, importance: list) -> dict:
    now = datetime.utcnow()
    doc = {
        "dataset_id": dataset_id,
        "target_column": target_column,
        "problem_type": problem_type,
        "model_used": model_used,
        "importance": importance,
        "generated_at": now,
        "version": 1
    }
    feature_importance_collection.update_one(
        {
            "dataset_id": dataset_id,
            "target_column": target_column,
            "problem_type": problem_type,
            "model_used": model_used
        },
        {"$set": {**doc, "updated_at": now}, "$setOnInsert": {"created_at": now}},
        upsert=True
    )
    return doc


def delete_feature_importance(dataset_id: str) -> int:
    result = feature_importance_collection.delete_many({"dataset_id": dataset_id})
    return result.deleted_count
