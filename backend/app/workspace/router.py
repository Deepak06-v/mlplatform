from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.workspace.schemas import (
    WorkspaceResponse,
    WorkspaceResetResponse,
    WorkspaceStateResponse,
    SectionUpdateRequest,
)
from app.workspace.service import get_workspace, get_user_workspace, reset_workspace
from app.workspace.state_service import (
    get_full_state,
    get_section,
    update_section,
    invalidate,
    reset_state,
)
from app.utils.workspace_helpers import verify_dataset_ownership

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
    reset_state(workspace["workspace_id"])
    return WorkspaceResetResponse(**result)


@router.get("/state", response_model=WorkspaceStateResponse)
def get_workspace_state(current_user: dict = Depends(get_current_user)):
    workspace = get_user_workspace(current_user["_id"])
    if not workspace:
        raise HTTPException(status_code=404, detail="No workspace found")
    state = get_full_state(workspace["workspace_id"])
    return WorkspaceStateResponse(**state) if state else WorkspaceStateResponse()


@router.get("/state/{section}")
def get_workspace_section(
    section: str,
    current_user: dict = Depends(get_current_user),
):
    workspace = get_user_workspace(current_user["_id"])
    if not workspace:
        raise HTTPException(status_code=404, detail="No workspace found")
    data = get_section(workspace["workspace_id"], section)
    return {section: data, "found": data is not None}


@router.patch("/state")
def update_workspace_section(
    request: SectionUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    workspace = get_user_workspace(current_user["_id"])
    if not workspace:
        raise HTTPException(status_code=404, detail="No workspace found")
    update_section(
        workspace["workspace_id"],
        request.section,
        request.data,
        update_status=request.status_key,
    )
    return {"status": "updated"}
