import AiBadge from "../common/AiBadge";

function ModelInsightsPanel({ insights, aiData, aiStatus }) {
  const showAi = aiStatus === "loaded" && Array.isArray(aiData) && aiData.length > 0;
  const items = showAi ? aiData : insights;

  if (!items || items.length === 0) return null;

  return (
    <div className="mt-8 bg-white p-5 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">🧠 Model Insights</h3>
        <AiBadge aiStatus={showAi ? "loaded" : aiStatus} />
      </div>

      <ul className={`list-disc pl-5 space-y-2 text-gray-700 ${aiStatus === "loading" ? "opacity-60" : ""}`}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default ModelInsightsPanel