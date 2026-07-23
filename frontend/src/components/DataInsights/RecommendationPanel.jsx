import AiBadge from "../common/AiBadge";

function RecommendationPanel({ recommendations, aiData, aiStatus }) {
  const showAi = aiStatus === "loaded" && Array.isArray(aiData) && aiData.length > 0;
  const items = showAi ? aiData : recommendations;

  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">⚙️ Recommendations</h3>
        <AiBadge aiStatus={showAi ? "loaded" : aiStatus} />
      </div>

      <div className={`space-y-4 ${aiStatus === "loading" ? "opacity-60" : ""}`}>
        {items.map((rec, i) => (
          <div
            key={rec.id || i}
            className={`p-4 rounded-xl border-l-4 shadow-sm transition duration-200 hover:shadow-md ${
              rec.severity === "critical"
                ? "bg-red-50 border-red-500"
                : rec.severity === "warning"
                ? "bg-yellow-50 border-yellow-500"
                : "bg-blue-50 border-blue-500"
            }`}
          >
            <p className="font-semibold text-gray-900">{rec.message}</p>
            <p className="text-sm mt-2 text-gray-700">
              👉 {rec.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecommendationPanel