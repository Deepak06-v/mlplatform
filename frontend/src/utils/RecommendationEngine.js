export function generateRecommendations(insights) {
  if (!insights) return []

  return insights.map((insight) => {
    let recommendation = ""

    switch (insight.category) {
      case "missing":
        recommendation = "Apply imputation (mean/median for numerical, mode for categorical)"
        break

      case "skew":
        recommendation = "Apply log or power transformation to normalize distribution"
        break

      case "correlation":
        recommendation = "Remove one of the correlated features to reduce redundancy"
        break

      case "cardinality":
        recommendation = "Use encoding techniques like target encoding or drop column"
        break

      case "target":
        recommendation = "Use class balancing techniques (SMOTE, class weights)"
        break

      default:
        recommendation = "Review data manually"
    }

    return {
      ...insight,
      recommendation
    }
  })
}