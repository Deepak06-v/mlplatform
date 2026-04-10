import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * Centralized API client with all endpoints
 */
const api = axios.create({
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
  }
};

/**
 * EDA (Exploratory Data Analysis) APIs
 */
export const edaAPI = {
  /**
   * Get comprehensive analysis of dataset
   * @param {string} datasetId - Dataset identifier
   * @returns {Promise} Analysis results
   */
  analyze: (datasetId) =>
    api.post("/eda/analyze", { dataset_id: datasetId }),

  /**
   * Compute feature importance for target column
   * @param {string} datasetId - Dataset identifier
   * @param {string} targetColumn - Target column name
   * @returns {Promise} Feature importance rankings
   */
  computeFeatureImportance: (datasetId, targetColumn) =>
    api.post("/eda/feature-importance", {
      dataset_id: datasetId,
      target_column: targetColumn
    }),

  /**
   * Train ML model
   * @param {string} datasetId - Dataset identifier
   * @param {string} targetColumn - Target column name
   * @param {string} algorithm - Algorithm name
   * @param {object} params - Model hyperparameters
   * @returns {Promise} Training metrics
   */
  trainModel: (datasetId, targetColumn, algorithm, params = {}) =>
    api.post("/eda/train-model", {
      dataset_id: datasetId,
      target_column: targetColumn,
      algorithm,
      params
    })
};

/**
 * Health check
 */
export const health = () => api.get("/");