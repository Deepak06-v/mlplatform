function ExplainabilityPanel({ insights }) {
  if (!insights || insights.length === 0) return null

  return (
    <div className="mt-8 bg-white p-5 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-3">
        🔍 Model Explainability
      </h3>

      <ul className="list-disc pl-5 text-gray-700 space-y-2">
        {insights.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default ExplainabilityPanel