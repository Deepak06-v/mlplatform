from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Any, Optional
from app.utils.validators import validate_dataset_id
from app.utils.response import APIResponse
from app.utils.experiment_helpers import (
    create_experiment, get_experiments, count_experiments,
    get_best_experiment, delete_experiments
)

router = APIRouter()


class ExperimentData(BaseModel):
    experiment_id: str
    dataset_id: str
    algorithm: str
    problem_type: str
    target_column: str
    preprocessing: dict = {}
    params: dict = {}
    metrics: dict = {}
    training_time: Optional[Any] = None
    timestamp: Optional[str] = None


@router.post("/create")
def create_experiment_endpoint(data: ExperimentData):
    validate_dataset_id(data.dataset_id)
    doc = create_experiment(data.model_dump())
    return APIResponse.success(doc, "Experiment created")


@router.get("/list")
def list_experiments(dataset_id: Optional[str] = Query(None)):
    if dataset_id:
        validate_dataset_id(dataset_id)
    experiments = get_experiments(dataset_id)
    return APIResponse.success(experiments, "Experiments retrieved")


@router.get("/count")
def get_experiment_count():
    total = count_experiments()
    return APIResponse.success({"total": total}, "Count retrieved")


@router.get("/best")
def best_experiment(dataset_id: str = Query(...)):
    validate_dataset_id(dataset_id)
    best = get_best_experiment(dataset_id)
    if not best:
        return APIResponse.success(None, "No experiments found")
    return APIResponse.success(best, "Best experiment retrieved")


@router.delete("/{dataset_id}")
def delete_experiments_endpoint(dataset_id: str):
    validate_dataset_id(dataset_id)
    deleted = delete_experiments(dataset_id)
    return APIResponse.success({"deleted": deleted}, "Experiments deleted")
