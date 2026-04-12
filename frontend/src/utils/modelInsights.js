export function generateModelInsights(metrics, problemType) {
  if (!metrics) return []

  const insights = []

  if (problemType === "classification") {
    if (metrics.accuracy < 0.7) {
      insights.push("Model accuracy is low → try more complex models or feature engineering")
    }

    if (metrics.f1 && metrics.f1 < 0.6) {
      insights.push("F1 score is low → dataset may be imbalanced")
    }

  } else {
    if (metrics.r2 < 0.5) {
      insights.push("Low R² score → model not capturing patterns well")
    }

    if (metrics.rmse > 50) {
      insights.push("High RMSE → predictions are far from actual values")
    }
  }

  return insights
}