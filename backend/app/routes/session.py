from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.auth.dependencies import get_current_user
from app.utils.validators import validate_dataset_id
from app.utils.response import APIResponse
from app.utils.workspace_helpers import verify_dataset_ownership
from app.utils.session_helpers import (
    get_session, upsert_session, patch_session, delete_session
)

router = APIRouter()


class SessionData(BaseModel):
    target_column: Optional[str] = None
    problem_type: Optional[str] = None
    preprocess_config: Optional[dict] = None
    current_pipeline_stage: Optional[str] = None


@router.get("/{dataset_id}")
def get_dataset_session(dataset_id: str, current_user: dict = Depends(get_current_user)):
    validate_dataset_id(dataset_id)
    verify_dataset_ownership(dataset_id, current_user["_id"])
    session = get_session(dataset_id)
    if not session:
        return APIResponse.success({"dataset_id": dataset_id}, "No session found")
    return APIResponse.success(session, "Session retrieved")


@router.put("/{dataset_id}")
def upsert_dataset_session(dataset_id: str, data: SessionData, current_user: dict = Depends(get_current_user)):
    validate_dataset_id(dataset_id)
    verify_dataset_ownership(dataset_id, current_user["_id"])
    upserted = upsert_session(
        dataset_id,
        data.model_dump(exclude_none=True)
    )
    return APIResponse.success(upserted, "Session saved")


@router.patch("/{dataset_id}")
def patch_dataset_session(dataset_id: str, data: SessionData, current_user: dict = Depends(get_current_user)):
    validate_dataset_id(dataset_id)
    verify_dataset_ownership(dataset_id, current_user["_id"])
    updates = data.model_dump(exclude_none=True)
    if not updates:
        return APIResponse.success(None, "No updates provided")
    patched = patch_session(dataset_id, updates)
    return APIResponse.success(patched, "Session updated")


@router.delete("/{dataset_id}")
def delete_dataset_session(dataset_id: str, current_user: dict = Depends(get_current_user)):
    validate_dataset_id(dataset_id)
    verify_dataset_ownership(dataset_id, current_user["_id"])
    deleted = delete_session(dataset_id)
    if deleted:
        return APIResponse.success(None, "Session deleted")
    return APIResponse.success(None, "No session to delete")
