import { useAiRecommendation } from "../../hooks/useAiRecommendation";
import AiBadge from "../common/AiBadge";

function Recommendations({ recommendations, datasetId, store, aiEnabled = false }) {
  const { aiResult, aiStatus } = useAiRecommendation({
    datasetId,
    page: "upload",
    store,
    enabled: aiEnabled
  });

  const aiData = aiResult?.data;
  const showAi = aiEnabled && aiStatus === "loaded" && Array.isArray(aiData) && aiData.length > 0;
  const hasStatic = Array.isArray(recommendations) && recommendations.length > 0;

  if (!hasStatic && !showAi && aiStatus !== "loading") return null;

  const items = showAi ? aiData : recommendations;

  return (
    <div className="mt-6 bg-white p-4 rounded-xl shadow">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Smart Recommendations</h2>
        <AiBadge
          aiStatus={showAi ? "loaded" : aiStatus}
          error={aiStatus === "failed" ? aiResult?.error : undefined}
        />
      </div>

      <div className={`space-y-3 ${aiStatus === "loading" ? "opacity-60" : ""}`}>
        {items.map((rec, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg text-sm ${
              rec.type === "critical"
                ? "bg-red-50 text-red-700"
                : rec.type === "warning"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {rec.message}
          </div>
        ))}
      </div>

      {aiStatus === "loading" && (
        <p className="text-xs text-gray-400 mt-2">Upgrading with AI analysis...</p>
      )}
    </div>
  );
}

export default Recommendations;
