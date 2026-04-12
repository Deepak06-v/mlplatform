export function analyzeTarget(edaData, targetColumn) {
  if (!edaData || !targetColumn) return null

  const { categorical, numerical } = edaData

  // Check if target is categorical
  const catTarget = categorical?.find(c => c.column === targetColumn)

  if (catTarget) {
    const top = catTarget.top_categories?.[0]

    const isImbalanced = top?.percentage > 70

    return {
      type: "classification",
      unique: catTarget.unique_count,
      imbalance: isImbalanced,
      message: isImbalanced
        ? `Target is imbalanced (${top.percentage}%)`
        : "Target distribution looks balanced"
    }
  }

  // Otherwise treat as numerical
  const numTarget = numerical?.find(n => n.column === targetColumn)

  if (numTarget) {
    return {
      type: "regression",
      skew: numTarget.skew,
      message:
        Math.abs(numTarget.skew) > 1
          ? "Target is skewed → consider transformation"
          : "Target distribution looks normal"
    }
  }

  return null
}