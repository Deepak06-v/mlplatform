import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAiRecommendation } from "../services/aiRecommendationService.js";

/**
 * Hook for AI-powered recommendations.
 *
 * Always shows static content first, then upgrades to AI when available.
 *
 * @param {Object} options
 * @param {string} options.datasetId - Current dataset ID
 * @param {"upload"|"insights"|"playground"|"comparison"} options.page - Page name
 * @param {Object} options.store - storageUtils instance (for cache & settings)
 * @param {boolean} options.enabled - Whether AI mode is active
 * @param {Object} [options.extra={}] - Extra context passed to context builder
 * @param {boolean} [options.autoFetch=true] - Fetch AI on mount if not cached
 * @returns {{ aiResult, aiStatus, error, refresh }}
 */
export function useAiRecommendation({
  datasetId,
  page,
  store,
  enabled = false,
  extra = {},
  autoFetch = true
}) {
  const [aiResult, setAiResult] = useState(null);
  const [aiStatus, setAiStatus] = useState("disabled"); // disabled | loading | loaded | failed
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!datasetId || !enabled || !page) {
      setAiStatus("disabled");
      setAiResult(null);
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setAiStatus("loading");
    setError(null);

    try {
      const result = await fetchAiRecommendation(datasetId, page, store, extra);

      if (!result) {
        setAiStatus("disabled");
        setAiResult(null);
      } else if (result.status === "completed") {
        setAiResult(result);
        setAiStatus("loaded");
        store.saveAiRecommendation(datasetId, page, result);
        if (!result.from_cache && store.addActivity) {
          const pageLabels = { upload: "Upload", insights: "Data Insights", playground: "ML Playground", comparison: "Model Comparison" };
          store.addActivity(datasetId, {
            type: "ai",
            title: "AI recommendation generated",
            description: `${pageLabels[page] || page} analysis complete`
          });
        }
      } else if (result.status === "failed") {
        setAiStatus("failed");
        setError(result.error || "AI service unavailable");
      } else {
        setAiStatus("failed");
        setError("Unexpected AI response");
      }
    } catch (err) {
      setAiStatus("failed");
      setError(err.message || "Failed to fetch AI recommendation");
    } finally {
      fetchingRef.current = false;
    }
  }, [datasetId, page, enabled, store, extra]);

  // Restore from cache on mount
  useEffect(() => {
    if (!datasetId || !page || !enabled) {
      setAiStatus("disabled");
      setAiResult(null);
      return;
    }

    const cached = store.getAiRecommendation(datasetId, page);
    if (cached && cached.status === "completed") {
      setAiResult(cached);
      setAiStatus("loaded");
      return;
    }

    if (autoFetch) {
      refresh();
    }
  }, [datasetId, page, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { aiResult, aiStatus, error, refresh };
}

export default useAiRecommendation;
