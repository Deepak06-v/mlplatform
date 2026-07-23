import AiBadge from "../common/AiBadge";

function TargetInsights({ targetInfo, targetColumn, aiData, aiStatus }) {
  const showAi = aiStatus === "loaded" && aiData != null;

  const info = showAi ? {
    type: aiData.type || "classification",
    message: aiData.summary || targetInfo?.message || "",
    suggested: Array.isArray(aiData.suggested_models) ? aiData.suggested_models : []
  } : targetInfo;

  if (!info) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">🎯 Target Analysis</h3>
        <AiBadge aiStatus={showAi ? "loaded" : aiStatus} />
      </div>

      <div className={`p-4 bg-linear-to-br from-blue-50 via-blue-50 to-purple-50 rounded-xl border border-blue-200 ${aiStatus === "loading" ? "opacity-60" : ""}`}>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">Target Column</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{targetColumn}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">Problem Type</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {info.type === "classification"
                ? "📊 Classification"
                : "📈 Regression"}
            </p>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {info.message}
            </p>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="text-sm font-semibold text-blue-700">
              💡 Suggested models: {info.suggested?.length > 0
                ? info.suggested.join(", ")
                : info.type === "classification"
                  ? "Logistic Regression, Random Forest"
                  : "Linear Regression, Random Forest Regressor"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TargetInsights