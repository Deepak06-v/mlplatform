from datetime import datetime
from pydantic import BaseModel, Field
from typing import Any, Optional


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


class WorkspaceStateResponse(BaseModel):
    dataset: Any = None
    eda: Any = None
    preprocessing: Any = None
    training: Any = None
    feature_importance: Any = None
    ai_insights: Any = None
    status: dict = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SectionUpdateRequest(BaseModel):
    section: str
    data: Any
    status_key: Optional[str] = None
