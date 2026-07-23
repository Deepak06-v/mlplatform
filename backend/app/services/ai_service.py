"""
AI Recommendation Service
Generates LLM-powered recommendations for each page in the ML platform.
Caching strategy: in-memory (TTL + LRU) -> MongoDB -> LLM.
"""

import hashlib
import json
import logging
import os
import time
from collections import OrderedDict
from typing import Optional

from app.utils.ai_recommendation_helpers import (
    get_recommendation as get_mongo_recommendation,
    save_recommendation as save_mongo_recommendation,
    touch_recommendation as touch_mongo_recommendation
)

logger = logging.getLogger(__name__)

# In-memory cache settings
MAX_CACHE_SIZE = 50
CACHE_TTL_SECONDS = 3600  # 1 hour


class TTLCache:
    """LRU cache with per-entry TTL."""

    def __init__(self, max_size=MAX_CACHE_SIZE, ttl=CACHE_TTL_SECONDS):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.ttl = ttl
        self.hits = 0
        self.misses = 0

    def get(self, key):
        if key not in self.cache:
            self.misses += 1
            return None
        entry = self.cache[key]
        if time.time() - entry["ts"] > self.ttl:
            del self.cache[key]
            self.misses += 1
            return None
        self.hits += 1
        self.cache.move_to_end(key)
        return entry["value"]

    def set(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = {"value": value, "ts": time.time()}
        if len(self.cache) > self.max_size:
            self.cache.popitem(last=False)

    def clear(self):
        self.cache.clear()


_in_memory_cache = TTLCache()

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

FALLBACK_RESPONSES = {
    "upload": {"status": "fallback", "data": None},
    "insights": {"status": "fallback", "data": None},
    "playground": {"status": "fallback", "data": None},
    "comparison": {"status": "fallback", "data": None}
}


class AiRecommendationService:
    def __init__(self):
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.client = None
        self._init_client()

    def _init_client(self):
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

    def get_recommendation(self, page: str, context: dict, dataset_id: str = "") -> dict:
        context_hash = self._compute_hash(context)
        cache_key = f"{dataset_id}_{page}_{context_hash}" if dataset_id else f"{page}_{context_hash}"

        cached = _in_memory_cache.get(cache_key)
        if cached:
            return {**cached, "from_cache": True}

        mongo_doc = get_mongo_recommendation(dataset_id, page, context_hash) if dataset_id else None
        if mongo_doc:
            result = {
                "status": "completed",
                "generated_at": mongo_doc.get("generated_at", time.time()),
                "model": mongo_doc.get("model", self.model),
                "context_hash": context_hash,
                "data": mongo_doc.get("recommendation"),
                "from_cache": True
            }
            _in_memory_cache.set(cache_key, result)
            if dataset_id:
                touch_mongo_recommendation(dataset_id, page, context_hash)
            return result

        prompt = self._build_prompt(page, context)
        if not prompt:
            return self._error_response(context_hash, f"Unknown page: {page}")

        llm_response = self._call_llm(prompt)
        if llm_response.get("status") == "failed":
            response = llm_response
            response["context_hash"] = context_hash
            return response

        generated_at = time.time()
        result = {
            "status": "completed",
            "generated_at": generated_at,
            "model": self.model,
            "context_hash": context_hash,
            "data": llm_response.get("data"),
            "from_cache": False
        }

        _in_memory_cache.set(cache_key, result)
        if dataset_id:
            save_mongo_recommendation(dataset_id, page, {
                "context_hash": context_hash,
                "model": self.model,
                "data": result["data"],
                "generated_at": generated_at
            })
        return result

    def _compute_hash(self, context: dict) -> str:
        raw = json.dumps(context, sort_keys=True, default=str)
        return hashlib.md5(raw.encode()).hexdigest()[:12]

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

    def _error_response(self, context_hash: str, error: str) -> dict:
        return {
            "status": "failed",
            "error": error,
            "generated_at": time.time(),
            "model": self.model,
            "context_hash": context_hash,
            "data": None,
            "from_cache": False
        }


ai_service = AiRecommendationService()
