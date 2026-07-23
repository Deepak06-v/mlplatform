import AiBadge from "../common/AiBadge";

function InsightPanel({ insights, aiData, aiStatus }) {
  const showAi = aiStatus === "loaded" && Array.isArray(aiData) && aiData.length > 0;
  const items = showAi ? aiData : insights;
  const hasData = items && items.length > 0;

  if (!hasData) {
    return (
      <div className="text-gray-500 text-sm">
        No significant insights detected.
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">🧠 Insights</h3>
        <AiBadge aiStatus={showAi ? "loaded" : aiStatus} />
      </div>

      <div className={`space-y-3 ${aiStatus === "loading" ? "opacity-60" : ""}`}>
        {items.map((item, i) => (
          <div
            key={item.id || i}
            className={`p-4 rounded-xl border-l-4 transition duration-200 ${
              item.severity === "critical"
                ? "bg-red-50 border-red-500 text-red-700 hover:shadow-sm"
                : item.severity === "warning"
                ? "bg-yellow-50 border-yellow-500 text-yellow-700 hover:shadow-sm"
                : "bg-blue-50 border-blue-500 text-blue-700 hover:shadow-sm"
            }`}
          >
            <p className="text-sm font-medium">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InsightPanel