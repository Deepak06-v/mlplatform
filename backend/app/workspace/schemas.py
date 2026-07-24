from datetime import datetime
from pydantic import BaseModel, Field


class WorkspaceResponse(BaseModel):
    workspace_id: str
    user_id: str
    dataset_id: str | None = None
    status: str = "empty"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceResetResponse(BaseModel):
    workspace_id: str
    status: str
    message: str
