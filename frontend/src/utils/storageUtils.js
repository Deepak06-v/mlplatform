import { sessionAPI, experimentAPI, comparisonAPI, activityAPI } from "../../services/api";

const UI_PREFS_KEY = "ui_prefs";

export const storageUtils = {
  // =============================
  // UI Preferences (persisted in localStorage only)
  // =============================

  _getUiPrefs() {
    try {
      return JSON.parse(localStorage.getItem(UI_PREFS_KEY)) || {};
    } catch {
      return {};
    }
  },

  _setUiPrefs(prefs) {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  },

  getUiPref(key, defaultValue = null) {
    return this._getUiPrefs()[key] ?? defaultValue;
  },

  setUiPref(key, value) {
    const prefs = this._getUiPrefs();
    prefs[key] = value;
    this._setUiPrefs(prefs);
  },

  // Convenience wrappers — last dataset
  getDatasetId() {
    return this.getUiPref("lastDatasetId", "");
  },

  setDatasetId(id) {
    this.setUiPref("lastDatasetId", id);
  },

  // Convenience wrappers — AI mode
  getAiSettings() {
    return this.getUiPref("aiSettings", { mode: "static" });
  },

  saveAiSettings(settings) {
    this.setUiPref("aiSettings", settings);
  },

  // =============================
  // In-memory caches (current session only, no localStorage)
  // =============================

  _sessionCache: {},
  _edaCache: {},
  _fiCache: {},
  _aiCache: {},
  _experimentsCache: {},
  _comparisonCache: {},
  _activitiesCache: {},
  _columnTypes: null,
  _fileName: null,
  _previewData: null,

  // --- Column Types (in-memory, populated on upload) ---

  getColumnTypes() {
    return this._columnTypes;
  },

  setColumnTypes(types) {
    this._columnTypes = types;
  },

  // --- File Name (in-memory, populated on upload) ---

  getFileName() {
    return this._fileName;
  },

  setFileName(name) {
    this._fileName = name;
  },

  // --- Preview Data (in-memory, populated on upload) ---

  getPreviewData() {
    return this._previewData;
  },

  setPreviewData(data) {
    this._previewData = data;
  },

  // --- Session fields (in-memory + API) ---

  _getSession(datasetId) {
    if (!datasetId) return {};
    if (!this._sessionCache[datasetId]) {
      this._sessionCache[datasetId] = {};
    }
    return this._sessionCache[datasetId];
  },

  getTargetColumn(datasetId) {
    return this._getSession(datasetId).target_column || "";
  },

  setTargetColumn(datasetId, columnName) {
    if (!datasetId) return;
    this._getSession(datasetId).target_column = columnName;
    sessionAPI.patch(datasetId, { target_column: columnName }).catch(() => {});
  },

  getPreprocessConfig(datasetId) {
    return this._getSession(datasetId).preprocess_config || {};
  },

  savePreprocessConfig(datasetId, config) {
    if (!datasetId) return;
    this._getSession(datasetId).preprocess_config = config;
    sessionAPI.patch(datasetId, { preprocess_config: config }).catch(() => {});
  },

  getMLConfig(datasetId) {
    const session = this._getSession(datasetId);
    return {
      target_column: session.target_column || "",
      problem_type: session.problem_type || "",
      preprocess_config: session.preprocess_config || {},
      algorithm: session.algorithm || "",
      params: session.params || {}
    };
  },

  setMLConfig(datasetId, config) {
    if (!datasetId) return;
    const session = this._getSession(datasetId);
    if (config.target_column !== undefined) session.target_column = config.target_column;
    if (config.problem_type !== undefined) session.problem_type = config.problem_type;
    if (config.preprocess_config !== undefined) session.preprocess_config = config.preprocess_config;
    if (config.algorithm !== undefined) session.algorithm = config.algorithm;
    if (config.params !== undefined) session.params = config.params;
    const payload = {};
    for (const key of ["target_column", "problem_type", "preprocess_config"]) {
      if (config[key] !== undefined) payload[key] = config[key];
    }
    if (Object.keys(payload).length > 0) {
      sessionAPI.patch(datasetId, payload).catch(() => {});
    }
  },

  getPlaygroundConfig(datasetId) {
    const session = this._getSession(datasetId);
    return {
      algorithm: session.algorithm || "",
      params: session.params || { max_depth: 5, n_estimators: 100 }
    };
  },

  savePlaygroundConfig(datasetId, { algorithm, params }) {
    if (!datasetId) return;
    const session = this._getSession(datasetId);
    if (algorithm !== undefined) session.algorithm = algorithm;
    if (params !== undefined) session.params = params;
  },

  getPlaygroundResult(datasetId) {
    if (!datasetId) return null;
    return this._getSession(datasetId).training_result || null;
  },

  savePlaygroundResult(datasetId, result) {
    if (!datasetId) return;
    this._getSession(datasetId).training_result = result;
    this._getSession(datasetId).training_timestamp = new Date().toISOString();
  },

  // --- EDA results (in-memory) ---

  getEDA(datasetId) {
    if (!datasetId) return null;
    return this._edaCache?.[datasetId] || null;
  },

  saveEDA(datasetId, data) {
    if (!datasetId) return;
    this._edaCache = this._edaCache || {};
    this._edaCache[datasetId] = data;
  },

  removeEDA(datasetId) {
    if (!datasetId || !this._edaCache) return;
    delete this._edaCache[datasetId];
  },

  // --- Feature Importance (in-memory) ---

  getFeatureImportance(datasetId, targetColumn) {
    if (!datasetId || !targetColumn) return null;
    return this._fiCache?.[`${datasetId}_${targetColumn}`] || null;
  },

  saveFeatureImportance(datasetId, targetColumn, data) {
    if (!datasetId || !targetColumn) return;
    this._fiCache = this._fiCache || {};
    this._fiCache[`${datasetId}_${targetColumn}`] = data;
  },

  removeFeatureImportance(datasetId, targetColumn) {
    if (!datasetId || !targetColumn || !this._fiCache) return;
    delete this._fiCache[`${datasetId}_${targetColumn}`];
  },

  // --- AI Recommendations (in-memory) ---

  getAiRecommendation(datasetId, page) {
    if (!datasetId) return null;
    return this._aiCache?.[`${datasetId}_${page}`] || null;
  },

  saveAiRecommendation(datasetId, page, aiResponse) {
    if (!datasetId) return;
    this._aiCache = this._aiCache || {};
    this._aiCache[`${datasetId}_${page}`] = aiResponse;
  },

  removeAiRecommendation(datasetId, page) {
    if (!datasetId || !this._aiCache) return;
    delete this._aiCache[`${datasetId}_${page}`];
  },

  clearAllAiRecommendations(datasetId) {
    if (!datasetId || !this._aiCache) return;
    Object.keys(this._aiCache).forEach(key => {
      if (key.startsWith(`${datasetId}_`)) delete this._aiCache[key];
    });
  },

  // --- Experiments (in-memory + API) ---

  addTrainingExperiment(datasetId, { response, algorithm, params, preprocessing, metrics, problem_type, target_column }) {
    if (!datasetId) return;
    const experiment = {
      experiment_id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      dataset_id: datasetId,
      timestamp: new Date().toISOString(),
      algorithm,
      params: params || {},
      preprocessing: preprocessing || {},
      metrics: metrics || {},
      problem_type: problem_type || "",
      target_column: target_column || "",
      training_time: null
    };
    if (!this._experimentsCache[datasetId]) {
      this._experimentsCache[datasetId] = [];
    }
    this._experimentsCache[datasetId].push(experiment);
    this.savePlaygroundResult(datasetId, response);
    experimentAPI.create(experiment).catch(() => {});
    return this._experimentsCache[datasetId];
  },

  getTrainingHistory(datasetId) {
    if (!datasetId) return [];
    return this._experimentsCache[datasetId] || [];
  },

  getBestModel(datasetId) {
    const history = this.getTrainingHistory(datasetId);
    if (history.length === 0) return null;
    return history.reduce((best, exp) => {
      const bestScore = this._modelScore(best);
      const expScore = this._modelScore(exp);
      return expScore > bestScore ? exp : best;
    });
  },

  _modelScore(experiment) {
    const m = experiment.metrics || {};
    if (m.accuracy != null) return m.accuracy;
    if (m.f1 != null) return m.f1;
    if (m.r2 != null) return m.r2;
    return 0;
  },

  async syncExperiments(datasetId) {
    if (!datasetId) return;
    try {
      const response = await experimentAPI.list(datasetId);
      if (response && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          this._experimentsCache[datasetId] = response.data;
        }
      }
    } catch {}
  },

  // --- Model Comparison (in-memory + API) ---

  getComparisonResult(datasetId) {
    if (!datasetId) return null;
    return this._comparisonCache[datasetId] || null;
  },

  saveComparisonResult(datasetId, responseData) {
    if (!datasetId) return;
    this._comparisonCache[datasetId] = {
      result: responseData,
      leaderboard: responseData.leaderboard,
      recommendation: responseData.recommendation,
      best_model: responseData.best_model,
      timestamp: new Date().toISOString()
    };
    comparisonAPI.create(datasetId, responseData).catch(() => {});
  },

  async syncComparison(datasetId) {
    if (!datasetId) return;
    try {
      const response = await comparisonAPI.get(datasetId);
      if (response && response.data && response.data.ranking) {
        this._comparisonCache[datasetId] = {
          result: response.data.ranking,
          leaderboard: response.data.ranking.leaderboard,
          recommendation: response.data.ranking.recommendation,
          best_model: response.data.ranking.best_model,
          timestamp: response.data.updated_at || new Date().toISOString()
        };
      }
    } catch {}
  },

  // --- Activities (in-memory + API) ---

  getActivities(datasetId) {
    if (!datasetId) return [];
    return this._activitiesCache[datasetId] || [];
  },

  addActivity(datasetId, activity) {
    if (!datasetId) return;
    const activities = this._activitiesCache[datasetId] || [];
    const entry = {
      type: activity.type,
      title: activity.title,
      description: activity.description || "",
      timestamp: new Date().toISOString()
    };
    const updated = [...activities, entry];
    if (updated.length > 50) updated.splice(0, updated.length - 50);
    this._activitiesCache[datasetId] = updated;
    activityAPI.create({
      activity_id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      dataset_id: datasetId,
      activity_type: activity.type,
      title: activity.title,
      description: activity.description || "",
      metadata: {},
      severity: "info"
    }).catch(() => {});
  },

  async syncActivities(datasetId) {
    if (!datasetId) return;
    try {
      const response = await activityAPI.list(datasetId);
      if (response && Array.isArray(response.data) && response.data.length > 0) {
        const existing = this._activitiesCache[datasetId] || [];
        if (existing.length === 0) {
          this._activitiesCache[datasetId] = response.data.map(a => ({
            type: a.activity_type,
            title: a.title,
            description: a.description || "",
            timestamp: a.created_at || new Date().toISOString()
          }));
        }
      }
    } catch {}
  },

  // =============================
  // Sync from APIs (called on page mount)
  // =============================

  async syncDatasetSession(datasetId) {
    if (!datasetId) return;
    try {
      const response = await sessionAPI.get(datasetId);
      if (response && response.data) {
        const session = this._getSession(datasetId);
        for (const key of ["target_column", "problem_type", "preprocess_config"]) {
          if (response.data[key] !== undefined && response.data[key] !== null) {
            session[key] = response.data[key];
          }
        }
      }
    } catch {}
  },

  // =============================
  // Cleanup
  // =============================

  clearDataset(datasetId) {
    if (!datasetId) return;
    delete this._sessionCache[datasetId];
    delete this._edaCache?.[datasetId];
    delete this._experimentsCache[datasetId];
    delete this._comparisonCache[datasetId];
    delete this._activitiesCache[datasetId];
    if (this._aiCache) {
      Object.keys(this._aiCache).forEach(key => {
        if (key.startsWith(`${datasetId}_`)) delete this._aiCache[key];
      });
    }
    experimentAPI.delete(datasetId).catch(() => {});
    comparisonAPI.delete(datasetId).catch(() => {});
    activityAPI.delete(datasetId).catch(() => {});
    sessionAPI.delete(datasetId).catch(() => {});
  },

  clearDatasetCache(datasetId) {
    if (!datasetId) return;
    delete this._sessionCache[datasetId];
    delete this._edaCache?.[datasetId];
    delete this._experimentsCache[datasetId];
    delete this._comparisonCache[datasetId];
    delete this._activitiesCache[datasetId];
  },

  cleanupObsoleteKeys() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith("session_") ||
        key.startsWith("session_meta_") ||
        key.startsWith("session_exp_") ||
        key === "column_types" ||
        key === "preview_data" ||
        key === "file_name"
      )) {
        localStorage.removeItem(key);
      }
    }
  }
};

export default storageUtils;
