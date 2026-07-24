from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any
from app.auth.dependencies import get_current_user
from app.utils.validators import validate_dataset_id
from app.utils.response import APIResponse
from app.utils.workspace_helpers import verify_dataset_ownership
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
def create_comparison_endpoint(request: CreateComparisonRequest, current_user: dict = Depends(get_current_user)):
    validate_dataset_id(request.dataset_id)
    verify_dataset_ownership(request.dataset_id, current_user["_id"])
    doc = create_comparison(
        request.dataset_id,
        request.ranking.model_dump()
    )
    return APIResponse.success(doc, "Comparison saved")


@router.get("/{dataset_id}")
def get_comparison_endpoint(dataset_id: str, current_user: dict = Depends(get_current_user)):
    validate_dataset_id(dataset_id)
    verify_dataset_ownership(dataset_id, current_user["_id"])
    doc = get_comparison(dataset_id)
    if not doc:
        return APIResponse.success(None, "No comparison found")
    return APIResponse.success(doc, "Comparison retrieved")


@router.delete("/{dataset_id}")
def delete_comparison_endpoint(dataset_id: str, current_user: dict = Depends(get_current_user)):
    validate_dataset_id(dataset_id)
    verify_dataset_ownership(dataset_id, current_user["_id"])
    deleted = delete_comparison(dataset_id)
    if deleted:
        return APIResponse.success(None, "Comparison deleted")
    return APIResponse.success(None, "No comparison to delete")
