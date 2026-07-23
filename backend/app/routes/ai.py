"""
AI Recommendation Routes
Provides a single endpoint for all AI-powered recommendations.
Always returns immediately — never blocks the client.
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter()


class AIRecommendationRequest(BaseModel):
    dataset_id: str = Field(..., description="Dataset identifier")
    page: str = Field(..., description="Page name: upload, insights, playground, comparison")
    context: dict = Field(default_factory=dict, description="Page-specific context data for prompt building")


@router.post("/recommendations", tags=["AI Recommendations"])
def get_ai_recommendations(request: AIRecommendationRequest):
    """
    Get AI-powered recommendations for any page.
    
    Args:
        dataset_id: Identifies the dataset
        page: Which page needs recommendations
        context: Structured data describing the current page state
        
    Returns:
        Dict with status, data, metadata, and cache info
    """
    logger.info(
        "AI recommendation requested: page=%s dataset=%s",
        request.page, request.dataset_id
    )

    result = ai_service.get_recommendation(
        page=request.page,
        context=request.context,
        dataset_id=request.dataset_id
    )

    logger.info(
        "AI recommendation completed: page=%s status=%s from_cache=%s",
        request.page, result.get("status"), result.get("from_cache", False)
    )

    return result
