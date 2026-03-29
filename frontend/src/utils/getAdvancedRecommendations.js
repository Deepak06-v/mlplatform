export function getAdvancedRecommendations(columnAnalysis, totalRows) {
  if (!columnAnalysis) return [];

  const recommendations = [];

  columnAnalysis.forEach((col) => {
    const missing = parseFloat(col.missingPercent);

    // 🔥 Missing Value Intelligence
    if (missing > 40) {
      recommendations.push({
        type: "critical",
        column: col.name,
        message: `${col.name}: High missing values (${missing}%) → consider dropping or advanced imputation`,
      });
    } else if (missing > 10) {
      recommendations.push({
        type: "warning",
        column: col.name,
        message: `${col.name}: Moderate missing values (${missing}%) → use mean/median imputation`,
      });
    } else if (missing > 0) {
      recommendations.push({
        type: "info",
        column: col.name,
        message: `${col.name}: Minor missing values (${missing}%) → safe to fill`,
      });
    }

    // 🔥 Cardinality Detection
    if (col.uniqueValues > 50 && col.type === "categorical") {
      recommendations.push({
        type: "warning",
        column: col.name,
        message: `${col.name}: High cardinality (${col.uniqueValues} unique values) → use encoding techniques`,
      });
    }

    // 🔥 Constant Column Detection
    if (col.uniqueValues === 1) {
      recommendations.push({
        type: "critical",
        column: col.name,
        message: `${col.name}: Constant column → no predictive value`,
      });
    }
  });

  // 🔥 Dataset-level insight
  if (totalRows < 100) {
    recommendations.push({
      type: "info",
      message:
        "Dataset is small → avoid complex models like deep learning",
    });
  }

  return recommendations;
}