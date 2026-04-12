export function interpretFeatureImportance(data) {
  if (!data || data.length === 0) return []

  const top = data[0]

  return [
    `‘${top.feature}’ is the most influential feature`,
    "Top features contribute most to prediction decisions",
    "Low-importance features may be removed to simplify the model"
  ]
}