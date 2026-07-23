import { aiAPI } from "../../services/api.js";

const CONTEXT_BUILDERS = {
  upload: (store, extra, datasetId) => {
    const eda = store.getEDA(datasetId);
    if (!eda) return null;
    const { dataset_profile, columns, preview_data } = eda;
    return {
      rows: dataset_profile?.rows || 0,
      columns: dataset_profile?.columns || 0,
      missing_percentage: dataset_profile?.missing_percentage || 0,
      column_analysis: columns || [],
      sample_rows: preview_data || []
    };
  },

  insights: (store, extra, datasetId) => {
    const eda = store.getEDA(datasetId);
    if (!eda) return null;
    return {
      overview: { rows: eda.dataset_profile?.rows, columns: eda.dataset_profile?.columns, missing: eda.dataset_profile?.missing_percentage },
      numerical_summary: eda.numerical_summary || {},
      categorical_summary: eda.categorical_summary || {},
      correlation_summary: eda.correlation_summary || [],
      missing_summary: eda.missing_summary || {},
      target_column: store.getTargetColumn(datasetId) || "N/A",
      problem_type: eda.problem_type || "N/A"
    };
  },

  playground: (store, extra, datasetId) => {
    const eda = store.getEDA(datasetId);
    const config = store.getPlaygroundConfig(datasetId);
    const result = store.getPlaygroundResult(datasetId);
    return {
      algorithm: config?.algorithm || "N/A",
      params: config?.params || {},
      problem_type: eda?.problem_type || "N/A",
      metrics: result?.metrics || {},
      feature_importance: result?.feature_importance || []
    };
  },

  comparison: (store, extra, datasetId) => {
    const comp = store.getComparisonResult(datasetId);
    const eda = store.getEDA(datasetId);
    if (!comp) return null;
    return {
      problem_type: eda?.problem_type || "N/A",
      leaderboard: comp.leaderboard || [],
      best_model: comp.best_model || "N/A",
      recommendation: comp.recommendation || ""
    };
  }
};

export async function fetchAiRecommendation(datasetId, page, store, extra = {}) {
  const builder = CONTEXT_BUILDERS[page];
  if (!builder) throw new Error(`Unknown AI recommendation page: ${page}`);

  const context = builder(store, extra, datasetId);
  if (!context) return null;

  return aiAPI.getRecommendations(datasetId, page, context);
}

export default fetchAiRecommendation;
