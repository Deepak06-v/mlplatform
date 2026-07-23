import { sessionAPI } from "../../services/api";

const STORAGE_KEYS = {
  DATASET_ID: "dataset_id",
  COLUMN_TYPES: "column_types",
  FILE_NAME: "file_name",
  PREVIEW_DATA: "preview_data"
};

const SESSION_PREFIX = "session_";
const META_PREFIX = "session_meta_";
const SESSION_FIELDS = new Set(["target_column", "problem_type", "preprocess_config", "current_pipeline_stage"]);

function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      output[key] &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(output[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

export const storageUtils = {
  // =============================
  // Legacy dataset metadata (transient, not in session)
  // =============================
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

  // =============================
  // Per-dataset session
  // Session fields (target_column, problem_type, preprocess_config,
  // current_pipeline_stage) are synced to MongoDB via API.
  // Non-session fields (eda, playground, comparison, ai, activities)
  // remain in localStorage under session_<id>.
  // =============================

  // --- Internal helpers for session meta (in-memory + localStorage cache) ---

  _getSessionMeta(datasetId) {
    if (!datasetId) return {};
    try {
      const data = localStorage.getItem(META_PREFIX + datasetId);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  _setSessionMeta(datasetId, data) {
    if (!datasetId) return;
    const existing = this._getSessionMeta(datasetId);
    const merged = deepMerge(existing, data);
    localStorage.setItem(META_PREFIX + datasetId, JSON.stringify(merged));
  },

  // --- Session CRUD (synchronous, backed by local cache + async API) ---

  getDatasetSession(datasetId) {
    if (!datasetId) return null;
    try {
      // Session fields from meta cache
      const meta = this._getSessionMeta(datasetId);
      // Non-session fields from legacy session key
      const localData = localStorage.getItem(SESSION_PREFIX + datasetId);
      const local = localData ? JSON.parse(localData) : {};
      return { ...local, ...meta };
    } catch {
      return null;
    }
  },

  saveDatasetSession(datasetId, session) {
    if (!datasetId) return;
    const sessionFields = {};
    const nonSessionFields = {};
    for (const [key, value] of Object.entries(session)) {
      if (SESSION_FIELDS.has(key)) {
        sessionFields[key] = value;
      } else {
        nonSessionFields[key] = value;
      }
    }
    if (Object.keys(sessionFields).length > 0) {
      this._setSessionMeta(datasetId, sessionFields);
      sessionAPI.upsert(datasetId, sessionFields).catch(() => {});
    }
    if (Object.keys(nonSessionFields).length > 0) {
      const existing = localStorage.getItem(SESSION_PREFIX + datasetId);
      const local = existing ? JSON.parse(existing) : {};
      const merged = deepMerge(local, nonSessionFields);
      localStorage.setItem(SESSION_PREFIX + datasetId, JSON.stringify(merged));
    }
  },

  updateDatasetSession(datasetId, updates) {
    if (!datasetId) return;
    const sessionUpdates = {};
    const nonSessionUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (SESSION_FIELDS.has(key)) {
        sessionUpdates[key] = value;
      } else {
        nonSessionUpdates[key] = value;
      }
    }
    if (Object.keys(sessionUpdates).length > 0) {
      this._setSessionMeta(datasetId, sessionUpdates);
      sessionAPI.patch(datasetId, sessionUpdates).catch(() => {});
    }
    if (Object.keys(nonSessionUpdates).length > 0) {
      const existing = localStorage.getItem(SESSION_PREFIX + datasetId);
      const local = existing ? JSON.parse(existing) : {};
      const merged = deepMerge(local, nonSessionUpdates);
      localStorage.setItem(SESSION_PREFIX + datasetId, JSON.stringify(merged));
    }
  },

  clearDatasetSession(datasetId) {
    if (!datasetId) return;
    localStorage.removeItem(META_PREFIX + datasetId);
    localStorage.removeItem(SESSION_PREFIX + datasetId);
    sessionAPI.delete(datasetId).catch(() => {});
  },

  // --- Sync from API (called on page mount to hydrate local cache) ---

  async syncDatasetSession(datasetId) {
    if (!datasetId) return;
    try {
      const response = await sessionAPI.get(datasetId);
      if (response && response.data) {
        const meta = {};
        for (const key of SESSION_FIELDS) {
          if (response.data[key] !== undefined && response.data[key] !== null) {
            meta[key] = response.data[key];
          }
        }
        if (Object.keys(meta).length > 0) {
          this._setSessionMeta(datasetId, meta);
        }
      }
    } catch {
      // API unavailable — keep local cache as-is
    }
  },

  // --- Backward-compatible wrappers that delegate to the session ---

  // Target column
  getTargetColumn(datasetId) {
    const session = this.getDatasetSession(datasetId);
    return session?.target_column || "";
  },

  setTargetColumn(datasetId, columnName) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, { target_column: columnName });
  },

  // ML Config (aggregated for backward compat)
  getMLConfig(datasetId) {
    const session = this.getDatasetSession(datasetId);
    if (!session) return {};
    return {
      target_column: session.target_column || "",
      problem_type: session.problem_type || "",
      preprocess_config: session.preprocess_config || {},
      algorithm: session.playground?.algorithm || "",
      params: session.playground?.params || {}
    };
  },

  setMLConfig(datasetId, config) {
    if (!datasetId) return;
    const existing = this.getDatasetSession(datasetId) || { dataset_id: datasetId };
    if (config.target_column !== undefined) existing.target_column = config.target_column;
    if (config.problem_type !== undefined) existing.problem_type = config.problem_type;
    if (config.preprocess_config !== undefined) existing.preprocess_config = config.preprocess_config;
    if (config.algorithm !== undefined || config.params !== undefined) {
      existing.playground = existing.playground || {};
      if (config.algorithm !== undefined) existing.playground.algorithm = config.algorithm;
      if (config.params !== undefined) existing.playground.params = config.params;
    }
    this.saveDatasetSession(datasetId, existing);
  },

  // EDA results
  getEDA(datasetId) {
    if (!datasetId) return null;
    const session = this.getDatasetSession(datasetId);
    return session?.eda || null;
  },

  saveEDA(datasetId, data) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, { eda: data });
  },

  removeEDA(datasetId) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, { eda: null });
  },

  // Feature Importance (per target column, stored in session.playground.feature_importance)
  getFeatureImportance(datasetId, targetColumn) {
    if (!datasetId || !targetColumn) return null;
    const session = this.getDatasetSession(datasetId);
    return session?.playground?.feature_importance?.[targetColumn] || null;
  },

  saveFeatureImportance(datasetId, targetColumn, data) {
    if (!datasetId || !targetColumn) return;
    this.updateDatasetSession(datasetId, {
      playground: {
        feature_importance: { [targetColumn]: data }
      }
    });
  },

  removeFeatureImportance(datasetId, targetColumn) {
    if (!datasetId || !targetColumn) return;
    this.updateDatasetSession(datasetId, {
      playground: { feature_importance: { [targetColumn]: null } }
    });
  },

  // Preprocessing Config
  getPreprocessConfig(datasetId) {
    const session = this.getDatasetSession(datasetId);
    return session?.preprocess_config || {};
  },

  savePreprocessConfig(datasetId, preprocessConfig) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, { preprocess_config: preprocessConfig });
  },

  // ML Playground Config
  getPlaygroundConfig(datasetId) {
    const session = this.getDatasetSession(datasetId);
    return {
      algorithm: session?.playground?.algorithm || "",
      params: session?.playground?.params || { max_depth: 5, n_estimators: 100 }
    };
  },

  savePlaygroundConfig(datasetId, { algorithm, params }) {
    if (!datasetId) return;
    const updates = { playground: {} };
    if (algorithm !== undefined) updates.playground.algorithm = algorithm;
    if (params !== undefined) updates.playground.params = params;
    this.updateDatasetSession(datasetId, updates);
  },

  // --- New session-specific methods ---

  // Training result
  getPlaygroundResult(datasetId) {
    if (!datasetId) return null;
    const session = this.getDatasetSession(datasetId);
    return session?.playground?.training_result || null;
  },

  savePlaygroundResult(datasetId, result) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, {
      playground: {
        training_result: result,
        training_timestamp: new Date().toISOString()
      }
    });
  },

  // Training history (append-only, each training creates an experiment entry)
  addTrainingExperiment(datasetId, { response, algorithm, params, preprocessing, metrics, problem_type, target_column }) {
    if (!datasetId) return;
    const session = this.getDatasetSession(datasetId) || { dataset_id: datasetId };
    const history = session.playground?.training_history || [];
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
    history.push(experiment);
    this.updateDatasetSession(datasetId, {
      playground: {
        training_history: history,
        training_result: response,
        training_timestamp: experiment.timestamp
      }
    });
  },

  getTrainingHistory(datasetId) {
    if (!datasetId) return [];
    const session = this.getDatasetSession(datasetId);
    return session?.playground?.training_history || [];
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

  // Model Comparison result
  getComparisonResult(datasetId) {
    if (!datasetId) return null;
    const session = this.getDatasetSession(datasetId);
    return session?.comparison || null;
  },

  saveComparisonResult(datasetId, responseData) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, {
      comparison: {
        result: responseData,
        leaderboard: responseData.leaderboard,
        recommendation: responseData.recommendation,
        best_model: responseData.best_model,
        timestamp: new Date().toISOString()
      }
    });
  },

  // --- AI Recommendation cache (per-page, inside session) ---

  getAiSettings(datasetId) {
    if (!datasetId) return { mode: "static" };
    const session = this.getDatasetSession(datasetId);
    return session?.ai_settings || { mode: "static" };
  },

  saveAiSettings(datasetId, settings) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, { ai_settings: settings });
  },

  getAiRecommendation(datasetId, page) {
    if (!datasetId) return null;
    const session = this.getDatasetSession(datasetId);
    return session?.ai_recommendations?.[page] || null;
  },

  saveAiRecommendation(datasetId, page, aiResponse) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, {
      ai_recommendations: { [page]: aiResponse }
    });
  },

  removeAiRecommendation(datasetId, page) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, {
      ai_recommendations: { [page]: null }
    });
  },

  clearAllAiRecommendations(datasetId) {
    if (!datasetId) return;
    this.updateDatasetSession(datasetId, { ai_recommendations: null });
  },

  // =============================
  // Activity Timeline
  // =============================

  getActivities(datasetId) {
    if (!datasetId) return [];
    const session = this.getDatasetSession(datasetId);
    return session?.activities || [];
  },

  addActivity(datasetId, activity) {
    if (!datasetId) return;
    const existing = this.getDatasetSession(datasetId);
    const activities = existing?.activities || [];
    const entry = {
      type: activity.type,
      title: activity.title,
      description: activity.description || "",
      timestamp: new Date().toISOString()
    };
    const updated = [...activities, entry];
    if (updated.length > 50) updated.splice(0, updated.length - 50);
    this.updateDatasetSession(datasetId, { activities: updated });
  },

  // =============================
  // Cross-dataset aggregations
  // =============================

  getAllSessions() {
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(SESSION_PREFIX) || key.startsWith(META_PREFIX))) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data) sessions.push(data);
        } catch {}
      }
    }
    return sessions;
  },

  countTrainedModels() {
    return this.getAllSessions().reduce((sum, s) => {
      const history = s?.playground?.training_history;
      return sum + (Array.isArray(history) ? history.length : (s?.playground?.training_result ? 1 : 0));
    }, 0);
  },

  // =============================
  // Cleanup
  // =============================

  removeMLConfig(datasetId) {
    this.clearDatasetSession(datasetId);
  },

  clearDatasetCache(datasetId) {
    this.clearDatasetSession(datasetId);
  },

  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(SESSION_PREFIX) || key.startsWith(META_PREFIX))) {
        localStorage.removeItem(key);
      }
    }
  },

  clearDataset() {
    const currentId = this.getDatasetId();
    if (currentId) {
      this.clearDatasetSession(currentId);
    }
    localStorage.removeItem(STORAGE_KEYS.DATASET_ID);
    localStorage.removeItem(STORAGE_KEYS.COLUMN_TYPES);
    localStorage.removeItem(STORAGE_KEYS.FILE_NAME);
    localStorage.removeItem(STORAGE_KEYS.PREVIEW_DATA);
  }
};

export default storageUtils;
