from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Optional
from app.utils.validators import validate_dataset_id
from app.utils.response import APIResponse
from app.utils.activity_helpers import (
    create_activity, get_activities, delete_activities
)

router = APIRouter()


class ActivityData(BaseModel):
    activity_id: str
    dataset_id: str
    experiment_id: Optional[str] = None
    activity_type: str
    title: str
    description: str = ""
    metadata: dict = {}
    severity: str = "info"


@router.post("/create")
def create_activity_endpoint(data: ActivityData):
    validate_dataset_id(data.dataset_id)
    doc = create_activity(data.model_dump())
    return APIResponse.success(doc, "Activity created")


@router.get("")
def list_all_activities(limit: int = 50):
    from app.utils.db import activities_collection
    docs = list(activities_collection.find({}, {"_id": 0}).sort("created_at", -1).limit(limit))
    return APIResponse.success(docs, "Activities retrieved")


@router.get("/{dataset_id}")
def get_activities_endpoint(dataset_id: str):
    validate_dataset_id(dataset_id)
    activities = get_activities(dataset_id)
    return APIResponse.success(activities, "Activities retrieved")


@router.delete("/{dataset_id}")
def delete_activities_endpoint(dataset_id: str):
    validate_dataset_id(dataset_id)
    deleted = delete_activities(dataset_id)
    return APIResponse.success({"deleted": deleted}, "Activities deleted")
