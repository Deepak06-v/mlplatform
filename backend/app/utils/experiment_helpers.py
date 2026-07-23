from datetime import datetime
from app.utils.db import experiments_collection


def create_experiment(data: dict) -> dict:
    now = datetime.utcnow()
    doc = {
        **data,
        "created_at": now,
        "updated_at": now
    }
    result = experiments_collection.insert_one(doc)
    doc.pop("_id", None)
    return doc


def get_experiments(dataset_id: str = None) -> list:
    query = {}
    if dataset_id:
        query["dataset_id"] = dataset_id
    cursor = experiments_collection.find(query, {"_id": 0}).sort("created_at", 1)
    return list(cursor)


def count_experiments() -> int:
    return experiments_collection.count_documents({})


def get_best_experiment(dataset_id: str) -> dict:
    experiments = get_experiments(dataset_id)
    if not experiments:
        return None

    def score(exp):
        m = exp.get("metrics", {})
        if m.get("accuracy") is not None:
            return m["accuracy"]
        if m.get("f1") is not None:
            return m["f1"]
        if m.get("r2") is not None:
            return m["r2"]
        return 0

    return max(experiments, key=score)


def delete_experiments(dataset_id: str) -> int:
    result = experiments_collection.delete_many({"dataset_id": dataset_id})
    return result.deleted_count
