export function generateInsights(edaData, targetColumn) {
  const insights = []

  if (!edaData) return insights

  const { missing, numerical, correlation, categorical } = edaData

  // =========================
  // 1. Missing Values
  // =========================
  missing?.forEach((col) => {
    const percent = col.missing_percentage

    if (percent > 30) {
      insights.push({
        id: `missing-${col.column}`,
        category: "missing",
        severity: "critical",
        message: `‘${col.column}’ has ${percent}% missing values → high risk for modeling`
      })
    } else if (percent > 5) {
      insights.push({
        id: `missing-${col.column}`,
        category: "missing",
        severity: "warning",
        message: `‘${col.column}’ has ${percent}% missing values → consider imputation`
      })
    }
  })

  // =========================
  // 2. Skewness
  // =========================
  numerical?.forEach((col) => {
    const skew = col.skew

    if (skew > 1) {
      insights.push({
        id: `skew-${col.column}`,
        category: "skew",
        severity: "warning",
        message: `‘${col.column}’ is highly right-skewed → consider log transform`
      })
    } else if (skew < -1) {
      insights.push({
        id: `skew-${col.column}`,
        category: "skew",
        severity: "warning",
        message: `‘${col.column}’ is highly left-skewed → consider normalization`
      })
    }
  })

  // =========================
  // 3. Correlation
  // =========================
  if (correlation?.matrix && correlation?.columns) {
    const cols = correlation.columns
    const matrix = correlation.matrix

    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const val = matrix[i][j]

        if (Math.abs(val) > 0.8) {
          insights.push({
            id: `corr-${cols[i]}-${cols[j]}`,
            category: "correlation",
            severity: "warning",
            message: `‘${cols[i]}’ and ‘${cols[j]}’ are highly correlated → remove one`
          })
        }
      }
    }
  }

  // =========================
  // 4. High Cardinality
  // =========================
  categorical?.forEach((col) => {
    if (col.unique_count > 50) {
      insights.push({
        id: `card-${col.column}`,
        category: "cardinality",
        severity: "warning",
        message: `‘${col.column}’ has high cardinality (${col.unique_count}) → encoding may be difficult`
      })
    }
  })

  // =========================
  // 5. Target Imbalance
  // =========================
  if (targetColumn) {
    const target = categorical?.find(c => c.column === targetColumn)

    if (target?.top_categories?.length) {
      const top = target.top_categories[0]

      if (top.percentage > 70) {
        insights.push({
          id: "target-imbalance",
          category: "target",
          severity: "critical",
          message: `Target ‘${targetColumn}’ is highly imbalanced (${top.percentage}%) → model bias likely`
        })
      }
    }
  }

  return insights
}