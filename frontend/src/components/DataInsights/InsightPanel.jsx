function InsightPanel({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No significant insights detected.
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">🧠 Insights</h3>

      <div className="space-y-3">
        {insights.map((item) => (
          <div
            key={item.id}
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