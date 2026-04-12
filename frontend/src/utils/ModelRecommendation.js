export function getModelRecommendations(targetInfo, edaData) {
  if (!targetInfo) return []

  const recommendations = []

  if (targetInfo.type === "classification") {
    recommendations.push({
      name: "Logistic Regression",
      reason: "Good baseline model for classification problems"
    })

    recommendations.push({
      name: "Decision Tree",
      reason: "Handles non-linear patterns and is easy to interpret"
    })

    recommendations.push({
      name: "Random Forest",
      reason: "High accuracy and handles complex relationships"
    })

    if (targetInfo.imbalance) {
      recommendations.push({
        name: "XGBoost",
        reason: "Works well with imbalanced datasets and complex patterns"
      })
    }

  } else if (targetInfo.type === "regression") {
    recommendations.push({
      name: "Linear Regression",
      reason: "Simple and effective for linear relationships"
    })

    recommendations.push({
      name: "Decision Tree Regressor",
      reason: "Captures non-linear relationships"
    })

    recommendations.push({
      name: "Random Forest Regressor",
      reason: "Robust and handles complex data well"
    })

    if (Math.abs(targetInfo.skew) > 1) {
      recommendations.push({
        name: "Gradient Boosting",
        reason: "Handles skewed and complex distributions effectively"
      })
    }
  }

  return recommendations
}