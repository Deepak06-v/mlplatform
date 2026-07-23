import { useEffect, useState } from "react";
import { storageUtils } from "../utils/storageUtils";
import { edaAPI } from "../../services/api";
import ModelComparisonDashboard from "../components/ModelComparison/ModelComparisonDashboard";
import { useAiRecommendation } from "../hooks/useAiRecommendation";
import { useNotification } from "../contexts/NotificationContext";

function ModelComparison() {
  const datasetId = storageUtils.getDatasetId();
  const mlConfig = storageUtils.getMLConfig(datasetId);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const { notify } = useNotification();

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await edaAPI.compareModels(
        datasetId,
        mlConfig.target_column,
        mlConfig.problem_type,
        mlConfig.preprocess_config
      );

      setData(response.data);
      storageUtils.saveComparisonResult(datasetId, response.data);
      storageUtils.addActivity(datasetId, {
        type: "comparison",
        title: "Model comparison completed",
        description: `${response.data?.leaderboard?.length || 0} models compared`
      });
      notify.success("Comparison complete", `${response.data?.leaderboard?.length || 0} models evaluated`);
    } catch (err) {
      console.error("Comparison failed:", err);
      setError(err.message || "Failed to compare models");
      notify.error("Comparison failed", err.message || "Failed to compare models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!datasetId) return;

    // Restore AI settings
    const settings = storageUtils.getAiSettings(datasetId);
    setAiEnabled(settings.mode === "ai");

    const cached = storageUtils.getComparisonResult(datasetId);
    if (cached?.result) {
      setData(cached.result);
      return;
    }

    fetchComparison();
  }, [datasetId]);

  const comparisonAi = useAiRecommendation({
    datasetId,
    page: "comparison",
    store: storageUtils,
    enabled: aiEnabled
  });

  if (!datasetId) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-center">
        <p className="font-semibold">No dataset selected</p>
        <p className="text-sm mt-1">Please upload and select a dataset first.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-800 font-semibold">Error: {error}</p>
        <button
          onClick={fetchComparison}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {data && (
          <ModelComparisonDashboard
            leaderboard={data.leaderboard}
            bestModel={data.best_model}
            recommendation={data.recommendation}
            problemType={mlConfig.problem_type}
            loading={loading}
            aiResult={comparisonAi.aiResult}
            aiStatus={comparisonAi.aiStatus}
          />
        )}

        {loading && !data && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Comparing models with cross-validation...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModelComparison;