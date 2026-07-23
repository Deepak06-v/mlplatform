from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from app.utils.validators import validate_dataset_id
from app.utils.response import APIResponse
from app.utils.comparison_helpers import (
    create_comparison, get_comparison, delete_comparison
)

router = APIRouter()


class ComparisonRanking(BaseModel):
    leaderboard: list = []
    best_model: str = ""
    insights: list = []
    recommendation: dict = {}


class CreateComparisonRequest(BaseModel):
    dataset_id: str
    ranking: ComparisonRanking


@router.post("/create")
def create_comparison_endpoint(request: CreateComparisonRequest):
    validate_dataset_id(request.dataset_id)
    doc = create_comparison(
        request.dataset_id,
        request.ranking.model_dump()
    )
    return APIResponse.success(doc, "Comparison saved")


@router.get("/{dataset_id}")
def get_comparison_endpoint(dataset_id: str):
    validate_dataset_id(dataset_id)
    doc = get_comparison(dataset_id)
    if not doc:
        return APIResponse.success(None, "No comparison found")
    return APIResponse.success(doc, "Comparison retrieved")


@router.delete("/{dataset_id}")
def delete_comparison_endpoint(dataset_id: str):
    validate_dataset_id(dataset_id)
    deleted = delete_comparison(dataset_id)
    if deleted:
        return APIResponse.success(None, "Comparison deleted")
    return APIResponse.success(None, "No comparison to delete")
