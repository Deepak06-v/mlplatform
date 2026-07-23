"""
AI Recommendation Service
Generates LLM-powered recommendations for each page in the ML platform.
Handles prompt building, LLM communication, caching, and error recovery.
"""

import hashlib
import json
import logging
import os
import time
from typing import Optional

logger = logging.getLogger(__name__)

# In-memory response cache: {page_context_hash: response_data}
_response_cache = {}

# Default prompt templates per page
PROMPT_TEMPLATES = {
    "upload": """You are a data science assistant analyzing a dataset. Provide 3-5 actionable recommendations.

DATASET PROFILE:
- Rows: {rows}
- Columns: {columns}
- Missing cells: {missing_percentage}%

COLUMN ANALYSIS:
{column_analysis}

SAMPLE DATA (first 3 rows):
{sample_rows}

For each recommendation, specify:
- type: "info", "warning", or "critical"
- message: clear actionable advice

Return ONLY a JSON array: [{{"type": "...", "message": "..."}}]
""",

    "insights": """You are a data science assistant. Analyze this dataset's EDA results and provide 3-5 strategic insights.

OVERVIEW:
{overview}

NUMERICAL COLUMNS (skew, range):
{numerical_summary}

CATEGORICAL COLUMNS (cardinality):
{categorical_summary}

CORRELATIONS (top):
{correlation_summary}

MISSING VALUES:
{missing_summary}

TARGET COLUMN: {target_column}
PROBLEM TYPE: {problem_type}

Return ONLY a JSON object with:
- "insights": array of {{"id": "string", "category": "string", "severity": "critical|warning|info", "message": "string"}}
- "recommendations": array of {{"id": "string", "severity": "critical|warning|info", "message": "string", "recommendation": "string"}}
- "target_analysis": {{"type": "classification|regression", "summary": "string", "suggested_models": ["string"]}}
- "model_suggestions": array of {{"name": "string", "reason": "string"}}
- "explainability": ["string"]
""",

    "playground": """You are a data science assistant analyzing a trained model.

ALGORITHM: {algorithm}
PARAMETERS: {params}
PROBLEM TYPE: {problem_type}

METRICS:
{metrics}

FEATURE IMPORTANCE:
{feature_importance}

Provide 3-5 concise model insights about performance, potential issues, and next steps.
Return ONLY a JSON array of strings: ["insight1", "insight2", ...]
""",

    "comparison": """You are a data science assistant analyzing model comparison results.

PROBLEM TYPE: {problem_type}

LEADERBOARD:
{leaderboard}

BEST MODEL: {best_model}
RECOMMENDATION: {recommendation}

Provide strategic analysis including:
- Why the best model won
- Tradeoffs to consider
- Deployment recommendations
- Any data quality concerns

Return ONLY a JSON object:
{{
    "summary": "2-3 sentence overview",
    "why_best_model_won": ["reason1", "reason2"],
    "tradeoffs": ["tradeoff1", "tradeoff2"],
    "deployment_advice": ["advice1", "advice2"],
    "data_quality_notes": ["note1", "note2"] if applicable
}}
"""
}

# Model characteristics metadata (used when LLM unavailable)
FALLBACK_RESPONSES = {
    "upload": {
        "status": "fallback",
        "data": None
    },
    "insights": {
        "status": "fallback",
        "data": None
    },
    "playground": {
        "status": "fallback",
        "data": None
    },
    "comparison": {
        "status": "fallback",
        "data": None
    }
}


class AiRecommendationService:
    """Generates AI-powered recommendations for ML platform pages."""

    def __init__(self):
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initialize the Gemini client if API key is available."""
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set. AI recommendations will use fallback.")
            return
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(
                model_name=self.model,
                system_instruction=(
                    "You are a data science assistant. "
                    "Respond ONLY with valid JSON. No markdown, no code blocks, no explanation."
                )
            )
            logger.info("Gemini client initialized with model: %s", self.model)
        except ImportError:
            logger.warning("google-generativeai package not installed. Install with: pip install google-generativeai")
        except Exception as e:
            logger.warning("Failed to initialize Gemini client: %s", e)

    def get_recommendation(self, page: str, context: dict) -> dict:
        """
        Get AI recommendation for a page.

        Args:
            page: One of "upload", "insights", "playground", "comparison"
            context: Dict of page-specific data

        Returns:
            Dict with status, data, generated_at, model, context_hash, from_cache
        """
        context_hash = self._compute_hash(context)
        cached = self._check_cache(page, context_hash)
        if cached:
            return cached

        prompt = self._build_prompt(page, context)
        if not prompt:
            return self._error_response(page, context_hash, f"Unknown page: {page}")

        llm_response = self._call_llm(prompt)
        if llm_response.get("status") == "failed":
            response = llm_response
            response["context_hash"] = context_hash
            return response

        result = {
            "status": "completed",
            "generated_at": time.time(),
            "model": self.model,
            "context_hash": context_hash,
            "data": llm_response.get("data"),
            "from_cache": False
        }

        self._cache_response(page, context_hash, result)
        return result

    def _compute_hash(self, context: dict) -> str:
        raw = json.dumps(context, sort_keys=True, default=str)
        return hashlib.md5(raw.encode()).hexdigest()[:12]

    def _check_cache(self, page: str, context_hash: str) -> Optional[dict]:
        key = f"{page}_{context_hash}"
        entry = _response_cache.get(key)
        if entry:
            return {**entry, "from_cache": True}
        return None

    def _cache_response(self, page: str, context_hash: str, response: dict):
        key = f"{page}_{context_hash}"
        _response_cache[key] = response
        logger.info("Cached AI response for %s [%s]", page, context_hash)

    def _build_prompt(self, page: str, context: dict) -> Optional[str]:
        template = PROMPT_TEMPLATES.get(page)
        if not template:
            return None

        safe_context = {}
        for key, value in context.items():
            if isinstance(value, (dict, list)):
                try:
                    safe_context[key] = json.dumps(value, indent=2, default=str)[:2000]
                except (TypeError, ValueError):
                    safe_context[key] = str(value)[:2000]
            else:
                safe_context[key] = str(value)[:500]

        try:
            return template.format(**safe_context)
        except KeyError as e:
            logger.warning("Missing context key for prompt: %s", e)
            return template.format(**{k: str(v) for k, v in safe_context.items()})

    def _call_llm(self, prompt: str) -> dict:
        if not self.client:
            return {
                "status": "failed",
                "error": "AI service not configured. Set GEMINI_API_KEY.",
                "generated_at": time.time()
            }

        try:
            response = self.client.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 1500
                }
            )

            content = response.text.strip()

            cleaned = content
            if content.startswith("```"):
                lines = content.split("\n")
                cleaned = "\n".join(
                    line for line in lines
                    if not line.strip().startswith("```")
                )

            parsed = json.loads(cleaned)
            return {"status": "completed", "data": parsed}

        except json.JSONDecodeError as e:
            logger.error("Failed to parse Gemini response as JSON: %s", e)
            return {
                "status": "failed",
                "error": f"Failed to parse AI response: {str(e)}",
                "generated_at": time.time()
            }
        except Exception as e:
            logger.error("Gemini call failed: %s", e)
            return {
                "status": "failed",
                "error": f"AI service error: {str(e)}",
                "generated_at": time.time()
            }

    def _error_response(self, page: str, context_hash: str, error: str) -> dict:
        return {
            "status": "failed",
            "error": error,
            "generated_at": time.time(),
            "model": self.model,
            "context_hash": context_hash,
            "data": None,
            "from_cache": False
        }


# Singleton instance
ai_service = AiRecommendationService()
