import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.services.ai_service import ai_service
from app.utils.workspace_helpers import verify_dataset_ownership
from app.workspace.state_service import get_section, update_section

logger = logging.getLogger(__name__)

router = APIRouter()


class AIRecommendationRequest(BaseModel):
    dataset_id: str = Field(..., description="Dataset identifier")
    page: str = Field(..., description="Page name: upload, insights, playground, comparison")
    context: dict = Field(default_factory=dict, description="Page-specific context data for prompt building")


@router.post("/recommendations", tags=["AI Recommendations"])
def get_ai_recommendations(
    request: AIRecommendationRequest,
    current_user: dict = Depends(get_current_user),
):
    logger.info("AI recommendation requested: page=%s dataset=%s", request.page, request.dataset_id)

    workspace_id = verify_dataset_ownership(request.dataset_id, current_user["_id"])

    ai_insights = get_section(workspace_id, "ai_insights") or {}
    cached = ai_insights.get(request.page)
    if cached and cached.get("status") == "success":
        logger.info("AI recommendation served from workspace state: page=%s", request.page)
        return {**cached, "from_cache": True}

    result = ai_service.get_recommendation(
        page=request.page,
        context=request.context,
        dataset_id=request.dataset_id,
    )

    if result.get("status") == "success":
        ai_insights[request.page] = result
        update_section(workspace_id, "ai_insights", ai_insights, update_status="ai_insights_generated")

    logger.info(
        "AI recommendation completed: page=%s status=%s from_cache=%s",
        request.page,
        result.get("status"),
        result.get("from_cache", False),
    )

    return result
