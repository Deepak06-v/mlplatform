import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * Centralized API client with all endpoints
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.detail || error.message || "An error occurred";
    console.error("[API Error]", message);
    return Promise.reject(new Error(message));
  }
);

/**
 * Dataset Management APIs
 */
export const datasetAPI = {
  /**
   * Upload a CSV dataset
   * @param {File} file - CSV file to upload
   * @returns {Promise} Upload result with dataset_id
   */
  upload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/dataset/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  /**
   * Get full dataset metadata including preview rows
   * @param {string} datasetId
   * @returns {Promise} Dataset metadata + preview
   */
  get: (datasetId) => api.get(`/dataset/${datasetId}`),
};

/**
 * EDA (Exploratory Data Analysis) APIs
 */
export const edaAPI = {
  analyze: (datasetId) =>
    api.post("/eda/analyze", { dataset_id: datasetId }),

  computeFeatureImportance: (datasetId, targetColumn) =>
    api.post("/eda/feature-importance", {
      dataset_id: datasetId,
      target_column: targetColumn
    }),

  trainModel: (
    datasetId,
    targetColumn,
    algorithm,
    params = {},
    preprocessConfig = {}
  ) =>
    api.post("/eda/train-model", {
      dataset_id: datasetId,
      target_column: targetColumn,
      algorithm,
      params,
      preprocess_config: preprocessConfig
    }),

  // ✅ CORRECTLY INSIDE OBJECT
  compareModels: (
    datasetId,
    targetColumn,
    problemType,
    preprocessConfig = {}
  ) =>
    api.post("/eda/compare-models", {
      dataset_id: datasetId,
      target_column: targetColumn,
      problem_type: problemType,
      preprocess_config: preprocessConfig
    })
};

/**
 * AI Recommendation APIs
 */
export const aiAPI = {
  getRecommendations: (datasetId, page, context = {}) =>
    api.post("/ai/recommendations", {
      dataset_id: datasetId,
      page,
      context
    })
};

/**
 * Dataset listing
 */
export const datasetsAPI = {
  list: () => api.get("/datasets")
};

/**
 * Workspace APIs
 */
export const workspaceAPI = {
  current: () => api.get("/workspace/current"),
  reset: () => api.post("/workspace/reset"),
  state: () => api.get("/workspace/state"),
  section: (section) => api.get(`/workspace/state/${section}`),
  updateSection: (section, data, statusKey) =>
    api.patch("/workspace/state", { section, data, status_key: statusKey }),
};

/**
 * Dashboard APIs
 */
export const dashboardAPI = {
  health: () => api.get("/health")
};

/**
 * Dataset Session APIs
 */
export const sessionAPI = {
  get: (datasetId) => api.get(`/session/${datasetId}`),
  upsert: (datasetId, data) => api.put(`/session/${datasetId}`, data),
  patch: (datasetId, data) => api.patch(`/session/${datasetId}`, data),
  delete: (datasetId) => api.delete(`/session/${datasetId}`),
};

/**
 * Experiment APIs
 */
export const experimentAPI = {
  create: (data) => api.post("/experiments/create", data),
  list: (datasetId) => api.get(`/experiments/list${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  count: () => api.get("/experiments/count"),
  best: (datasetId) => api.get(`/experiments/best?dataset_id=${datasetId}`),
  delete: (datasetId) => api.delete(`/experiments/${datasetId}`),
};

/**
 * Comparison APIs
 */
export const comparisonAPI = {
  create: (datasetId, ranking) => api.post("/comparisons/create", { dataset_id: datasetId, ranking }),
  get: (datasetId) => api.get(`/comparisons/${datasetId}`),
  delete: (datasetId) => api.delete(`/comparisons/${datasetId}`),
};

/**
 * Activity APIs
 */
export const activityAPI = {
  create: (data) => api.post("/activities/create", data),
  list: (datasetId) => api.get(`/activities/${datasetId}`),
  listAll: (limit = 50) => api.get(`/activities?limit=${limit}`),
  delete: (datasetId) => api.delete(`/activities/${datasetId}`),
};

/**
 * Monitoring APIs
 */
export const monitoringAPI = {
  health: () => api.get("/health"),
  healthMemory: () => api.get("/health/memory"),
  healthStorage: () => api.get("/health/storage"),
  healthCache: () => api.get("/health/cache"),
  metrics: () => api.get("/metrics"),
  version: () => api.get("/version"),
};

/**
 * Settings / Config APIs
 */
export const settingsAPI = {
  config: () => api.get("/settings/config"),
  get: () => api.get("/settings"),
  update: (payload) => api.put("/settings", payload),
  reset: () => api.post("/settings/reset"),
};

/**
 * Cache Management APIs
 */
export const cacheAPI = {
  clearDataset: () => api.post("/cache/clear/dataset"),
  clearAi: () => api.post("/cache/clear/ai"),
};

/**
 * Cleanup APIs
 */
export const cleanupAPI = {
  report: () => api.post("/cleanup/report"),
  execute: (dryRun = true) => api.post(`/cleanup/execute?dry_run=${dryRun}`),
};

/**
 * Health check
 */
export const health = () => api.get("/");