from datetime import datetime
from app.utils.db import comparisons_collection, experiments_collection


def create_comparison(dataset_id: str, ranking: dict) -> dict:
    now = datetime.utcnow()

    experiment_ids = []
    best_experiment_id = None
    best_score = -1
    cursor = experiments_collection.find(
        {"dataset_id": dataset_id}, {"_id": 0}
    )
    for exp in cursor:
        eid = exp.get("experiment_id")
        if eid:
            experiment_ids.append(eid)
            m = exp.get("metrics", {})
            score = m.get("accuracy") or m.get("f1") or m.get("r2") or 0
            if score > best_score:
                best_score = score
                best_experiment_id = eid

    comparison_metric = "f1_weighted"
    if ranking.get("leaderboard") and len(ranking["leaderboard"]) > 0:
        first = ranking["leaderboard"][0]
        if first.get("score") is not None:
            pass

    doc = {
        "dataset_id": dataset_id,
        "experiment_ids": experiment_ids,
        "best_experiment_id": best_experiment_id,
        "comparison_metric": comparison_metric,
        "ranking": ranking,
        "created_at": now,
        "updated_at": now
    }

    comparisons_collection.update_one(
        {"dataset_id": dataset_id},
        {"$set": doc},
        upsert=True
    )

    doc.pop("_id", None)
    return doc


def get_comparison(dataset_id: str) -> dict:
    doc = comparisons_collection.find_one(
        {"dataset_id": dataset_id}, {"_id": 0}
    )
    return doc


def delete_comparison(dataset_id: str) -> bool:
    result = comparisons_collection.delete_one({"dataset_id": dataset_id})
    return result.deleted_count > 0
