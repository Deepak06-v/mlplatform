function TargetInsights({ targetInfo, targetColumn }) {
  if (!targetInfo) return null

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        🎯 Target Analysis
      </h3>

      <div className="p-4 bg-linear-to-br from-blue-50 via-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">Target Column</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{targetColumn}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">Problem Type</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {targetInfo.type === "classification"
                ? "📊 Classification"
                : "📈 Regression"}
            </p>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {targetInfo.message}
            </p>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="text-sm font-semibold text-blue-700">
              💡{" "}
              {targetInfo.type === "classification"
                ? "Suggested models: Logistic Regression, Random Forest"
                : "Suggested models: Linear Regression, Random Forest Regressor"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TargetInsights