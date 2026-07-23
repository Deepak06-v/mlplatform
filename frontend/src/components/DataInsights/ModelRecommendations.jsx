import AiBadge from "../common/AiBadge";

function ModelRecommendations({ models, aiData, aiStatus }) {
  const showAi = aiStatus === "loaded" && Array.isArray(aiData) && aiData.length > 0;
  const items = showAi ? aiData : models;

  if (!items || items.length === 0) return null;

  return (
    <div className="mt-10 bg-white p-5 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🤖 Recommended Models</h3>
        <AiBadge aiStatus={showAi ? "loaded" : aiStatus} />
      </div>

      <div className={`grid md:grid-cols-2 gap-4 ${aiStatus === "loading" ? "opacity-60" : ""}`}>
        {items.map((model, index) => (
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