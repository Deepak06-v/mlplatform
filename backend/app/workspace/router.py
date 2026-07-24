from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.workspace.schemas import WorkspaceResponse, WorkspaceResetResponse
from app.workspace.service import get_workspace, get_user_workspace, reset_workspace

router = APIRouter(tags=["Workspace"])


@router.get("/current", response_model=WorkspaceResponse)
def current_workspace(current_user: dict = Depends(get_current_user)):
    workspace = get_user_workspace(current_user["_id"])
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No workspace found for this user",
        )
    return WorkspaceResponse(**workspace)


@router.post("/reset", response_model=WorkspaceResetResponse)
def reset_current_workspace(current_user: dict = Depends(get_current_user)):
    workspace = get_user_workspace(current_user["_id"])
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No workspace found",
        )
    result = reset_workspace(workspace["workspace_id"], current_user["_id"])
    return WorkspaceResetResponse(**result)
