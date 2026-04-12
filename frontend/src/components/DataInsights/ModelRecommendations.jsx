function ModelRecommendations({ models }) {
  if (!models || models.length === 0) return null

  return (
    <div className="mt-10 bg-white p-5 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        🤖 Recommended Models
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        {models.map((model, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg hover:shadow-md transition"
          >
            <p className="font-semibold text-gray-800">
              {model.name}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {model.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ModelRecommendations