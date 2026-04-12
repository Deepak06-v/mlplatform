function RecommendationPanel({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">⚙️ Recommendations</h3>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
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