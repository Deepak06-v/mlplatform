/**
 * LocalStorage utilities for state persistence
 */

const STORAGE_KEYS = {
  DATASET_ID: "dataset_id",
  COLUMN_TYPES: "column_types",
  ML_CONFIG: "ml_config",
  FILE_NAME: "file_name",
  PREVIEW_DATA: "preview_data"
};

export const storageUtils = {
  // Dataset state
  getDatasetId() {
    return localStorage.getItem(STORAGE_KEYS.DATASET_ID);
  },
  setDatasetId(id) {
    localStorage.setItem(STORAGE_KEYS.DATASET_ID, id);
  },
  
  getColumnTypes() {
    const data = localStorage.getItem(STORAGE_KEYS.COLUMN_TYPES);
    return data ? JSON.parse(data) : [];
  },
  setColumnTypes(types) {
    localStorage.setItem(STORAGE_KEYS.COLUMN_TYPES, JSON.stringify(types));
  },
  
  getFileName() {
    return localStorage.getItem(STORAGE_KEYS.FILE_NAME);
  },
  setFileName(name) {
    localStorage.setItem(STORAGE_KEYS.FILE_NAME, name);
  },
  
  getPreviewData() {
    const data = localStorage.getItem(STORAGE_KEYS.PREVIEW_DATA);
    return data ? JSON.parse(data) : [];
  },
  setPreviewData(data) {
    localStorage.setItem(STORAGE_KEYS.PREVIEW_DATA, JSON.stringify(data));
  },
  
  // ML Config
  getMLConfig(datasetId) {
    const data = localStorage.getItem(STORAGE_KEYS.ML_CONFIG);
    const config = data ? JSON.parse(data) : {};
    return config[datasetId] || {};
  },
  
  setMLConfig(datasetId, config) {
    const data = localStorage.getItem(STORAGE_KEYS.ML_CONFIG);
    const allConfig = data ? JSON.parse(data) : {};
    allConfig[datasetId] = config;
    localStorage.setItem(STORAGE_KEYS.ML_CONFIG, JSON.stringify(allConfig));
  },
  
  getTargetColumn(datasetId) {
    const config = this.getMLConfig(datasetId);
    return config.target_column || "";
  },
  
  setTargetColumn(datasetId, columnName) {
    const config = this.getMLConfig(datasetId);
    config.target_column = columnName;
    this.setMLConfig(datasetId, config);
  },
  
  // Clear
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
  
  clearDataset() {
    localStorage.removeItem(STORAGE_KEYS.DATASET_ID);
    localStorage.removeItem(STORAGE_KEYS.COLUMN_TYPES);
    localStorage.removeItem(STORAGE_KEYS.FILE_NAME);
    localStorage.removeItem(STORAGE_KEYS.PREVIEW_DATA);
  }
};

export default storageUtils;
