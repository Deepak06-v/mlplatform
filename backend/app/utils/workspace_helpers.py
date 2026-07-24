from fastapi import HTTPException, status
from app.utils.db import dataset_collection
from app.workspace.service import get_user_workspace


def verify_dataset_ownership(dataset_id: str, user_id: str) -> str:
    workspace = get_user_workspace(user_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )
    dataset = dataset_collection.find_one(
        {
            "dataset_id": dataset_id,
            "workspace_id": workspace["workspace_id"],
        },
        {"dataset_id": 1},
    )
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or access denied",
        )
    return workspace["workspace_id"]


def require_workspace(user_id: str) -> dict:
    workspace = get_user_workspace(user_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )
    return workspace
