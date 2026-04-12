function ModelInsightsPanel({ insights }) {
  if (!insights || insights.length === 0) return null

  return (
    <div className="mt-8 bg-white p-5 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-3">
        🧠 Model Insights
      </h3>

      <ul className="list-disc pl-5 space-y-2 text-gray-700">
        {insights.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default ModelInsightsPanel