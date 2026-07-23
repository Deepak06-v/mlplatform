import { useEffect, useState, useCallback, useRef } from "react";
import {
  Settings, Globe, Cpu, Upload, Database,
  HardDrive, Activity, Palette, Bell, RefreshCw, Info, Zap,
  Check, Trash2, Download, Upload as UploadIcon
} from "lucide-react";

import SettingsSection, { SettingsRow } from "../components/Settings/SettingsSection";
import { monitoringAPI, settingsAPI, cleanupAPI, cacheAPI } from "../../services/api";
import { storageUtils } from "../utils/storageUtils";
import { useNotification } from "../contexts/NotificationContext";
import { useSession } from "../contexts/SessionContext";

const AI_PROVIDERS = ["Auto", "Gemini", "OpenAI", "Claude"];
const AI_LENGTHS = ["Short", "Medium", "Detailed"];
const PROBLEM_TYPES = ["Auto", "Classification", "Regression"];
const THEMES = ["Light", "Dark", "System"];
const ACCENT_COLORS = ["Indigo", "Blue", "Emerald", "Violet", "Rose", "Amber"];
const LANDING_PAGES = ["/dashboard", "/upload", "/settings"];
const SETTINGS_VERSION = 1;

const DEFAULTS = {
  mlPrefs: { defaultProblemType: "auto", cvFolds: 5, evalMetric: "accuracy", autoScaling: true, autoSelection: false, randomSeed: 42 },
  appearance: { theme: "light", accentColor: "indigo", compactMode: false, animations: true, sidebarDefault: "expanded" },
  notifications: { success: true, warning: true, error: true, training: true, aiRecommendation: true },
  upload: { previewRows: 10, autoDetectTypes: true, autoEda: false },
};

function SettingsPage() {
  const { notify } = useNotification();
  const { session, dataset, datasetId } = useSession();
  const refreshRef = useRef(null);

  const [health, setHealth] = useState(null);
  const [memory, setMemory] = useState(null);
  const [storage, setStorage] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [config, setConfig] = useState(null);
  const [cleanupReport, setCleanupReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const aiPrefs = storageUtils.getAiSettings();
  const [aiMode, setAiMode] = useState(aiPrefs.mode === "ai");
  const [aiProvider, setAiProvider] = useState(aiPrefs.provider || "Auto");
  const [aiResponseLength, setAiResponseLength] = useState(aiPrefs.responseLength || "Medium");
  const [aiCaching, setAiCaching] = useState(aiPrefs.caching !== false);

  const storedMlPrefs = storageUtils.getUiPref("mlPrefs", DEFAULTS.mlPrefs);
  const [mlPrefs, setMlPrefs] = useState(storedMlPrefs);

  const storedAppearance = storageUtils.getUiPref("appearance", DEFAULTS.appearance);
  const [appearance, setAppearance] = useState(storedAppearance);

  const storedNotifs = storageUtils.getUiPref("notifications", DEFAULTS.notifications);
  const [notifications, setNotifications] = useState(storedNotifs);

  const storedUpload = storageUtils.getUiPref("uploadPrefs", DEFAULTS.upload);
  const [uploadPrefs, setUploadPrefs] = useState(storedUpload);

  const [landingPage, setLandingPage] = useState(storageUtils.getUiPref("landingPage", "/dashboard"));

  const applyAppearance = useCallback((app) => {
    document.documentElement.classList.toggle("compact", app.compactMode);
    document.documentElement.classList.toggle("animations-disabled", !app.animations);
    document.documentElement.setAttribute("data-accent", app.accentColor);
    document.documentElement.setAttribute("data-theme", app.theme);
  }, []);

  useEffect(() => { applyAppearance(appearance); }, [appearance, applyAppearance]);

  useEffect(() => {
    settingsAPI.get().then((res) => {
      const data = res?.data;
      if (!data) return;
      const remoteVersion = data.version || 0;
      if (remoteVersion >= SETTINGS_VERSION) {
        if (data.default_problem_type) setMlPrefs((prev) => ({ ...prev, defaultProblemType: data.default_problem_type }));
        if (data.cv_folds) setMlPrefs((prev) => ({ ...prev, cvFolds: data.cv_folds }));
        if (data.eval_metric) setMlPrefs((prev) => ({ ...prev, evalMetric: data.eval_metric }));
        if (data.auto_scaling !== undefined) setMlPrefs((prev) => ({ ...prev, autoScaling: data.auto_scaling }));
        if (data.auto_selection !== undefined) setMlPrefs((prev) => ({ ...prev, autoSelection: data.auto_selection }));
        if (data.random_seed !== undefined) setMlPrefs((prev) => ({ ...prev, randomSeed: data.random_seed }));
        if (data.theme) setAppearance((prev) => ({ ...prev, theme: data.theme }));
        if (data.accent_color) setAppearance((prev) => ({ ...prev, accentColor: data.accent_color }));
        if (data.compact_mode !== undefined) setAppearance((prev) => ({ ...prev, compactMode: data.compact_mode }));
        if (data.animations !== undefined) setAppearance((prev) => ({ ...prev, animations: data.animations }));
        if (data.sidebar_default) setAppearance((prev) => ({ ...prev, sidebarDefault: data.sidebar_default }));
        if (data.notifications) setNotifications(data.notifications);
        if (data.preview_rows) setUploadPrefs((prev) => ({ ...prev, previewRows: data.preview_rows }));
        if (data.auto_detect_types !== undefined) setUploadPrefs((prev) => ({ ...prev, autoDetectTypes: data.auto_detect_types }));
        if (data.auto_eda !== undefined) setUploadPrefs((prev) => ({ ...prev, autoEda: data.auto_eda }));
        if (data.ai_provider) setAiProvider(data.ai_provider);
        if (data.ai_mode) setAiMode(data.ai_mode === "ai");
        if (data.ai_response_length) setAiResponseLength(data.ai_response_length);
        if (data.ai_caching !== undefined) setAiCaching(data.ai_caching);
        if (data.landing_page) setLandingPage(data.landing_page);
      }
    }).catch(() => {});
  }, []);

  const persistSettings = useCallback(() => {
    if (syncing) return;
    setSyncing(true);
    const payload = {
      version: SETTINGS_VERSION,
      ai_provider: aiProvider,
      ai_mode: aiMode ? "ai" : "static",
      ai_response_length: aiResponseLength,
      ai_caching: aiCaching,
      default_problem_type: mlPrefs.defaultProblemType,
      cv_folds: mlPrefs.cvFolds,
      eval_metric: mlPrefs.evalMetric,
      auto_scaling: mlPrefs.autoScaling,
      auto_selection: mlPrefs.autoSelection,
      random_seed: mlPrefs.randomSeed,
      preview_rows: uploadPrefs.previewRows,
      auto_detect_types: uploadPrefs.autoDetectTypes,
      auto_eda: uploadPrefs.autoEda,
      theme: appearance.theme,
      accent_color: appearance.accentColor,
      compact_mode: appearance.compactMode,
      animations: appearance.animations,
      sidebar_default: appearance.sidebarDefault,
      notifications,
      landing_page: landingPage,
    };
    settingsAPI.update(payload).finally(() => setSyncing(false));
  }, [aiMode, aiProvider, aiResponseLength, aiCaching, mlPrefs, appearance, notifications, uploadPrefs, landingPage, syncing]);

  useEffect(() => {
    const timer = setTimeout(persistSettings, 2000);
    return () => clearTimeout(timer);
  }, [persistSettings]);

  const fetchAll = useCallback(async () => {
    try {
      const [h, m, s, c, mt, cfg] = await Promise.allSettled([
        monitoringAPI.health(),
        monitoringAPI.healthMemory(),
        monitoringAPI.healthStorage(),
        monitoringAPI.healthCache(),
        monitoringAPI.metrics(),
        settingsAPI.config(),
      ]);
      if (h.status === "fulfilled") setHealth(h.value);
      if (m.status === "fulfilled") setMemory(m.value);
      if (s.status === "fulfilled") setStorage(s.value);
      if (c.status === "fulfilled") setCacheInfo(c.value);
      if (mt.status === "fulfilled") setMetrics(mt.value);
      if (cfg.status === "fulfilled") setConfig(cfg.value);
      setError(null);
    } catch {
      setError("Failed to fetch monitoring data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    refreshRef.current = setInterval(fetchAll, 15000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchAll]);

  const saveAi = useCallback((updates) => {
    const current = storageUtils.getAiSettings();
    storageUtils.saveAiSettings({ ...current, ...updates });
  }, []);

  const handleAiMode = (v) => { setAiMode(v); saveAi({ mode: v ? "ai" : "static" }); };
  const handleAiProvider = (v) => { setAiProvider(v); saveAi({ provider: v }); };
  const handleAiLength = (v) => { setAiResponseLength(v); saveAi({ responseLength: v }); };
  const handleAiCaching = (v) => { setAiCaching(v); saveAi({ caching: v }); };

  const saveMlPrefs = useCallback((updates) => {
    setMlPrefs((prev) => {
      const next = { ...prev, ...updates };
      storageUtils.setUiPref("mlPrefs", next);
      return next;
    });
  }, []);

  const saveAppearance = useCallback((updates) => {
    setAppearance((prev) => {
      const next = { ...prev, ...updates };
      storageUtils.setUiPref("appearance", next);
      return next;
    });
  }, []);

  const saveNotifications = useCallback((updates) => {
    setNotifications((prev) => {
      const next = { ...prev, ...updates };
      storageUtils.setUiPref("notifications", next);
      return next;
    });
  }, []);

  const saveUploadPrefs = useCallback((updates) => {
    setUploadPrefs((prev) => {
      const next = { ...prev, ...updates };
      storageUtils.setUiPref("uploadPrefs", next);
      return next;
    });
  }, []);

  const handleLandingPage = (v) => { setLandingPage(v); storageUtils.setUiPref("landingPage", v); };

  const handleClearDatasetCache = async () => {
    try {
      const res = await cacheAPI.clearDataset();
      notify.success("Cache cleared", `Dataset cache cleared (${res?.data?.entries_removed || 0} entries removed)`);
      fetchAll();
    } catch {
      notify.error("Cache clear failed", "Could not clear dataset cache");
    }
  };

  const handleClearAiCache = async () => {
    try {
      const res = await cacheAPI.clearAi();
      notify.success("Cache cleared", `AI cache cleared (${res?.data?.entries_removed || 0} entries removed)`);
      fetchAll();
    } catch {
      notify.error("Cache clear failed", "Could not clear AI cache");
    }
  };

  const handleCleanupReport = async () => {
    try {
      const res = await cleanupAPI.report();
      setCleanupReport(res?.data || res);
      notify.success("Cleanup scan complete", "See Storage section for details");
    } catch {
      notify.error("Cleanup scan failed", "Could not scan storage");
    }
  };

  const handleCleanupExecute = async () => {
    try {
      const res = await cleanupAPI.execute(false);
      const data = res?.data || res;
      const deleted = data?.deleted_count || 0;
      notify.success("Cleanup complete", `Removed ${deleted} orphaned file${deleted !== 1 ? "s" : ""}`);
      handleCleanupReport();
    } catch {
      notify.error("Cleanup failed", "Could not execute cleanup");
    }
  };

  const handleRefreshSession = () => window.location.reload();

  const handleExportSession = () => {
    if (!session) return;
    const blob = new Blob([JSON.stringify({ session, dataset }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${datasetId || "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success("Session exported", "Session data downloaded");
  };

  const handleClearSession = () => {
    const id = storageUtils.getDatasetId();
    if (id) storageUtils.clearDataset(id);
    storageUtils.setDatasetId("");
    notify.success("Session cleared", "Dataset session has been cleared");
  };

  const handleExportSettings = () => {
    const payload = {
      version: SETTINGS_VERSION,
      exported_at: new Date().toISOString(),
      ai: { provider: aiProvider, mode: aiMode ? "ai" : "static", responseLength: aiResponseLength, caching: aiCaching },
      ml: mlPrefs,
      appearance,
      notifications,
      upload: uploadPrefs,
      landing_page: landingPage,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settings-export.json";
    a.click();
    URL.revokeObjectURL(url);
    notify.success("Settings exported", "Settings file downloaded");
  };

  const handleImportSettings = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!imported.version) { notify.error("Invalid file", "Not a valid settings export"); return; }
          if (imported.ai) {
            handleAiProvider(imported.ai.provider || "Auto");
            handleAiMode(imported.ai.mode === "ai");
            handleAiLength(imported.ai.responseLength || "Medium");
            handleAiCaching(imported.ai.caching !== false);
          }
          if (imported.ml) saveMlPrefs(imported.ml);
          if (imported.appearance) saveAppearance(imported.appearance);
          if (imported.notifications) saveNotifications(imported.notifications);
          if (imported.upload) saveUploadPrefs(imported.upload);
          if (imported.landing_page) handleLandingPage(imported.landing_page);
          notify.success("Settings imported", "All settings have been applied");
        } catch {
          notify.error("Import failed", "Could not parse settings file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleResetSettings = async () => {
    try {
      await settingsAPI.reset();
      setAiMode(false);
      setAiProvider("Auto");
      setAiResponseLength("Medium");
      setAiCaching(true);
      setMlPrefs(DEFAULTS.mlPrefs);
      setAppearance(DEFAULTS.appearance);
      setNotifications(DEFAULTS.notifications);
      setUploadPrefs(DEFAULTS.upload);
      setLandingPage("/dashboard");
      storageUtils.setUiPref("mlPrefs", DEFAULTS.mlPrefs);
      storageUtils.setUiPref("appearance", DEFAULTS.appearance);
      storageUtils.setUiPref("notifications", DEFAULTS.notifications);
      storageUtils.setUiPref("uploadPrefs", DEFAULTS.upload);
      storageUtils.setUiPref("landingPage", "/dashboard");
      storageUtils.saveAiSettings({ mode: "static" });
      notify.success("Settings reset", "All settings restored to defaults");
    } catch {
      notify.error("Reset failed", "Could not reset settings");
    }
  };

  const backendUp = health?.services?.backend === "healthy";
  const mongoUp = health?.services?.mongodb === "healthy";
  const systemUptime = health?.uptime_seconds;
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  function formatUptime(sec) {
    if (sec == null || sec < 0) return "N/A";
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function formatDate(val) {
    if (!val) return "—";
    const ms = typeof val === "number" ? val * 1000 : new Date(val).getTime();
    if (isNaN(ms)) return "—";
    return new Date(ms).toLocaleString();
  }

  function StatusDot({ ok }) {
    return (
      <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
    );
  }

  function Toggle({ value, onChange, disabled }) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${value ? "bg-indigo-600" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    );
  }

  function Select({ value, onChange, options }) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[130px]"
      >
        {options.map((o) => <option key={o} value={o.toLowerCase()}>{o}</option>)}
      </select>
    );
  }

  function NumberInput({ value, onChange, min, max, step }) {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => {
          let v = Number(e.target.value);
          if (!isNaN(v)) {
            if (min !== undefined) v = Math.max(min, v);
            if (max !== undefined) v = Math.min(max, v);
            onChange(v);
          }
        }}
        min={min}
        max={max}
        step={step}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    );
  }

  if (error && !health) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button onClick={fetchAll} className="text-sm text-indigo-600 hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-gray-700" />
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleImportSettings} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <UploadIcon className="w-3.5 h-3.5" /> Import
            </button>
            <button onClick={handleExportSettings} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={handleResetSettings} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 -mt-4 mb-6">Configure your application preferences</p>

        <SettingsSection title="General" icon={Globe}>
          <SettingsRow label="Environment">
            <span className="text-sm text-gray-600">{config?.server_mode || "development"}</span>
          </SettingsRow>
          <SettingsRow label="Backend Status">
            <span className="flex items-center gap-1.5">
              <StatusDot ok={backendUp} />
              <span className={backendUp ? "text-green-600" : "text-red-600"}>{backendUp ? "Online" : "Offline"}</span>
            </span>
          </SettingsRow>
          <SettingsRow label="API URL">
            <span className="text-sm text-gray-600">{apiBaseUrl}</span>
          </SettingsRow>
          <SettingsRow label="Default Landing Page">
            <select value={landingPage} onChange={(e) => handleLandingPage(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 min-w-[130px]">
              <option value="/dashboard">Dashboard</option>
              <option value="/upload">Upload</option>
              <option value="/settings">Settings</option>
            </select>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="AI Settings" icon={Zap} description="Configure AI recommendation behavior">
          <SettingsRow label="AI Provider">
            <Select value={aiProvider} onChange={handleAiProvider} options={AI_PROVIDERS} />
          </SettingsRow>
          <SettingsRow label="Enable AI">
            <Toggle value={aiMode} onChange={handleAiMode} />
          </SettingsRow>
          <SettingsRow label="Recommendation Mode">
            <select value={aiMode ? "ai" : "static"} onChange={(e) => handleAiMode(e.target.value === "ai")} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 min-w-[130px]">
              <option value="static">Static</option>
              <option value="ai">AI</option>
            </select>
          </SettingsRow>
          <SettingsRow label="AI Response Length">
            <Select value={aiResponseLength} onChange={handleAiLength} options={AI_LENGTHS} />
          </SettingsRow>
          <SettingsRow label="Enable AI Caching">
            <Toggle value={aiCaching} onChange={handleAiCaching} />
          </SettingsRow>
          <SettingsRow label="AI Service Status">
            {loading ? <span className="text-sm text-gray-400">Checking...</span> : (
              <span className={`text-sm ${health?.services?.ai_service === "available" ? "text-green-600" : "text-gray-400"}`}>
                {health?.services?.ai_service === "available" ? "Available" : health?.services?.ai_service === "unavailable" ? "Unavailable" : "Unknown"}
              </span>
            )}
          </SettingsRow>
          <SettingsRow label="AI Cache Entries">
            {loading ? <span className="text-sm text-gray-400">Loading...</span> : (
              <span className="text-sm text-gray-600">{cacheInfo?.ai_cache?.entries ?? 0} / {cacheInfo?.ai_cache?.max_entries ?? "—"}</span>
            )}
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="ML Preferences" icon={Cpu} description="Default machine learning behavior">
          <SettingsRow label="Default Problem Type">
            <Select value={mlPrefs.defaultProblemType} onChange={(v) => saveMlPrefs({ defaultProblemType: v })} options={PROBLEM_TYPES} />
          </SettingsRow>
          <SettingsRow label="Cross Validation Folds">
            <NumberInput value={mlPrefs.cvFolds} onChange={(v) => saveMlPrefs({ cvFolds: v })} min={2} max={10} />
          </SettingsRow>
          <SettingsRow label="Default Evaluation Metric">
            <select value={mlPrefs.evalMetric} onChange={(e) => saveMlPrefs({ evalMetric: e.target.value })} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 min-w-[130px]">
              <option value="accuracy">Accuracy</option>
              <option value="f1">F1 Score</option>
              <option value="precision">Precision</option>
              <option value="recall">Recall</option>
              <option value="r2">R² Score</option>
              <option value="rmse">RMSE</option>
            </select>
          </SettingsRow>
          <SettingsRow label="Auto Feature Scaling">
            <Toggle value={mlPrefs.autoScaling} onChange={(v) => saveMlPrefs({ autoScaling: v })} />
          </SettingsRow>
          <SettingsRow label="Auto Feature Selection">
            <Toggle value={mlPrefs.autoSelection} onChange={(v) => saveMlPrefs({ autoSelection: v })} />
          </SettingsRow>
          <SettingsRow label="Default Random Seed">
            <NumberInput value={mlPrefs.randomSeed} onChange={(v) => saveMlPrefs({ randomSeed: v })} min={0} max={999999} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Upload Settings" icon={Upload} description="Configure dataset upload behavior">
          <SettingsRow label="Maximum Upload Size">
            <span className="text-sm text-gray-600">{config?.max_upload_size_mb || 500} MB</span>
          </SettingsRow>
          <SettingsRow label="Supported File Types">
            <span className="text-sm text-gray-600">{(config?.supported_file_types || [".csv", ".json"]).join(", ")}</span>
          </SettingsRow>
          <SettingsRow label="Upload Directory">
            <span className="text-sm text-gray-600 font-mono">{config?.upload_dir || "uploads"}</span>
          </SettingsRow>
          <SettingsRow label="Preview Rows">
            <NumberInput value={uploadPrefs.previewRows} onChange={(v) => saveUploadPrefs({ previewRows: v })} min={5} max={100} step={5} />
          </SettingsRow>
          <SettingsRow label="Auto-detect Column Types">
            <Toggle value={uploadPrefs.autoDetectTypes} onChange={(v) => saveUploadPrefs({ autoDetectTypes: v })} />
          </SettingsRow>
          <SettingsRow label="Auto-generate EDA">
            <Toggle value={uploadPrefs.autoEda} onChange={(v) => saveUploadPrefs({ autoEda: v })} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Cache Settings" icon={Database} description="In-memory cache management" loading={loading && !cacheInfo}>
          <SettingsRow label="Dataset Cache">
            <span className="text-sm text-gray-600">{cacheInfo?.dataset_cache?.entries ?? 0} / {cacheInfo?.dataset_cache?.max_entries ?? "—"} entries</span>
          </SettingsRow>
          <SettingsRow label="AI Cache">
            <span className="text-sm text-gray-600">{cacheInfo?.ai_cache?.entries ?? 0} / {cacheInfo?.ai_cache?.max_entries ?? "—"} entries</span>
          </SettingsRow>
          <SettingsRow label="Cache Memory">
            <span className="text-sm text-gray-600">{cacheInfo?.dataset_cache?.memory_mb ?? "0"} MB</span>
          </SettingsRow>
          <SettingsRow label="Cache TTL">
            <span className="text-sm text-gray-600">{cacheInfo?.dataset_cache?.ttl_seconds ?? config?.cache_ttl_seconds ?? 3600}s</span>
          </SettingsRow>
          <SettingsRow label="Hit Rate">
            <span className="text-sm text-gray-600">{cacheInfo ? `${(cacheInfo.dataset_cache?.hits || 0) + (cacheInfo.ai_cache?.hits || 0)} hits, ${(cacheInfo.dataset_cache?.misses || 0) + (cacheInfo.ai_cache?.misses || 0)} misses` : "—"}</span>
          </SettingsRow>
          <SettingsRow label="">
            <div className="flex gap-2 w-full justify-end">
              <button onClick={handleClearDatasetCache} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Clear Dataset Cache
              </button>
              <button onClick={handleClearAiCache} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Clear AI Cache
              </button>
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Storage Settings" icon={HardDrive} description="Disk and MongoDB storage" loading={loading && !storage}>
          <SettingsRow label="Upload Folder Size">
            <span className="text-sm text-gray-600">{storage?.total_size_mb != null ? `${storage.total_size_mb} MB` : "—"}</span>
          </SettingsRow>
          <SettingsRow label="Uploaded Files">
            <span className="text-sm text-gray-600">{storage?.total_files ?? 0}</span>
          </SettingsRow>
          <SettingsRow label="Uploaded Datasets">
            <span className="text-sm text-gray-600">{metrics?.datasets_uploaded ?? storage?.datasets ?? 0}</span>
          </SettingsRow>
          <SettingsRow label="MongoDB Documents">
            <span className="text-sm text-gray-600">
              {storage ? `${storage.datasets || 0} datasets, ${storage.experiments || 0} experiments, ${storage.sessions || 0} sessions` : "—"}
            </span>
          </SettingsRow>
          <SettingsRow label="Cleanup Mode">
            <span className="text-sm text-gray-600">{config?.cleanup_enabled ? "Enabled" : "Disabled"}</span>
          </SettingsRow>
          <SettingsRow label="Cleanup Report">
            {cleanupReport ? (
              <span className="text-sm text-gray-600">{cleanupReport.orphaned_count || 0} orphaned, {cleanupReport.missing_count || 0} missing</span>
            ) : (
              <span className="text-sm text-gray-400">Not scanned</span>
            )}
          </SettingsRow>
          <SettingsRow label="">
            <div className="flex gap-2 w-full justify-end">
              <button onClick={handleCleanupReport} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Check className="w-3.5 h-3.5" /> Run Cleanup Scan
              </button>
              <button onClick={handleCleanupExecute} disabled={!config?.cleanup_enabled} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Trash2 className="w-3.5 h-3.5" /> Execute Cleanup
              </button>
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Monitoring" icon={Activity} description="Live system status (auto-refreshes every 15s)" loading={loading && !health}>
          <SettingsRow label="Backend Status">
            <span className="flex items-center gap-1.5">
              <StatusDot ok={backendUp} />
              <span className={`text-sm ${backendUp ? "text-green-600" : "text-red-600"}`}>{backendUp ? "Healthy" : "Unhealthy"}</span>
            </span>
          </SettingsRow>
          <SettingsRow label="MongoDB Status">
            <span className="flex items-center gap-1.5">
              <StatusDot ok={mongoUp} />
              <span className={`text-sm ${mongoUp ? "text-green-600" : "text-red-600"}`}>{mongoUp ? "Connected" : "Disconnected"}</span>
            </span>
          </SettingsRow>
          <SettingsRow label="Memory Usage">
            <span className="text-sm text-gray-600">{memory?.process_memory_mb != null ? `${memory.process_memory_mb} MB` : "—"}</span>
          </SettingsRow>
          <SettingsRow label="Cache Memory">
            <span className="text-sm text-gray-600">{memory?.cache_memory_mb != null ? `${memory.cache_memory_mb} MB` : "—"}</span>
          </SettingsRow>
          <SettingsRow label="Cache Status">
            <span className="text-sm text-gray-600">
              {cacheInfo ? `${cacheInfo.dataset_cache?.entries || 0} datasets, ${cacheInfo.ai_cache?.entries || 0} AI` : "—"}
            </span>
          </SettingsRow>
          <SettingsRow label="Upload Storage">
            <span className="text-sm text-gray-600">{storage?.total_size_mb != null ? `${storage.total_size_mb} MB (${storage.total_files || 0} files)` : "—"}</span>
          </SettingsRow>
          <SettingsRow label="System Uptime">
            <span className="text-sm text-gray-600">{formatUptime(systemUptime)}</span>
          </SettingsRow>
          <SettingsRow label="Experiment Metrics">
            <span className="text-sm text-gray-600">{metrics ? `${metrics.experiments_created || 0} experiments, ${metrics.comparisons || 0} comparisons` : "—"}</span>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Appearance" icon={Palette} description="Customize the interface">
          <SettingsRow label="Theme">
            <Select value={appearance.theme} onChange={(v) => saveAppearance({ theme: v })} options={THEMES} />
          </SettingsRow>
          <SettingsRow label="Accent Color">
            <div className="flex gap-1.5">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => saveAppearance({ accentColor: c.toLowerCase() })}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    appearance.accentColor === c.toLowerCase() ? "border-gray-800 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: { indigo: "#6366f1", blue: "#3b82f6", emerald: "#10b981", violet: "#8b5cf6", rose: "#f43f5e", amber: "#f59e0b" }[c.toLowerCase()] }}
                  title={c}
                />
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label="Compact Mode">
            <Toggle value={appearance.compactMode} onChange={(v) => saveAppearance({ compactMode: v })} />
          </SettingsRow>
          <SettingsRow label="Animations">
            <Toggle value={appearance.animations} onChange={(v) => saveAppearance({ animations: v })} />
          </SettingsRow>
          <SettingsRow label="Sidebar Default State">
            <select value={appearance.sidebarDefault} onChange={(e) => saveAppearance({ sidebarDefault: e.target.value })} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 min-w-[130px]">
              <option value="expanded">Expanded</option>
              <option value="collapsed">Collapsed</option>
            </select>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Notifications" icon={Bell} description="Toggle notification types">
          <SettingsRow label="Success Notifications">
            <Toggle value={notifications.success} onChange={(v) => saveNotifications({ success: v })} />
          </SettingsRow>
          <SettingsRow label="Warning Notifications">
            <Toggle value={notifications.warning} onChange={(v) => saveNotifications({ warning: v })} />
          </SettingsRow>
          <SettingsRow label="Error Notifications">
            <Toggle value={notifications.error} onChange={(v) => saveNotifications({ error: v })} />
          </SettingsRow>
          <SettingsRow label="Training Complete">
            <Toggle value={notifications.training} onChange={(v) => saveNotifications({ training: v })} />
          </SettingsRow>
          <SettingsRow label="AI Recommendation">
            <Toggle value={notifications.aiRecommendation} onChange={(v) => saveNotifications({ aiRecommendation: v })} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Session Management" icon={RefreshCw} description="Current dataset session">
          <SettingsRow label="Current Dataset">
            <span className="text-sm text-gray-600">{dataset?.filename || "—"}</span>
          </SettingsRow>
          <SettingsRow label="Dataset ID">
            <span className="text-sm font-mono text-gray-500">{datasetId || "—"}</span>
          </SettingsRow>
          <SettingsRow label="Rows / Columns">
            <span className="text-sm text-gray-600">{dataset?.rows != null ? `${dataset.rows} rows, ${dataset?.columns?.length || 0} columns` : "—"}</span>
          </SettingsRow>
          <SettingsRow label="Target Column">
            <span className="text-sm text-gray-600">{session?.target_column || "—"}</span>
          </SettingsRow>
          <SettingsRow label="Problem Type">
            <span className="text-sm text-gray-600">{session?.problem_type || "—"}</span>
          </SettingsRow>
          <SettingsRow label="Uploaded">
            <span className="text-sm text-gray-600">{formatDate(dataset?.created_at)}</span>
          </SettingsRow>
          <SettingsRow label="Last Activity">
            <span className="text-sm text-gray-600">{formatDate(dataset?.last_accessed)}</span>
          </SettingsRow>
          <SettingsRow label="">
            <div className="flex gap-2 w-full justify-end">
              <button onClick={handleRefreshSession} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Session
              </button>
              <button onClick={handleExportSession} disabled={!session} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Download className="w-3.5 h-3.5" /> Export Session
              </button>
              <button onClick={handleClearSession} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Clear Session
              </button>
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="About" icon={Info} description="Application information">
          <SettingsRow label="Backend Version">
            <span className="text-sm text-gray-600">{config?.version || "1.0.0"}</span>
          </SettingsRow>
          <SettingsRow label="Build Commit">
            <span className="text-sm font-mono text-gray-500">{config?.build || "unknown"}</span>
          </SettingsRow>
          <SettingsRow label="Backend Mode">
            <span className="text-sm text-gray-600">{config?.server_mode || "development"}</span>
          </SettingsRow>
          <SettingsRow label="Stack" tooltip="Technology stack">
            <span className="text-sm text-gray-600">React + FastAPI + MongoDB</span>
          </SettingsRow>
          <SettingsRow label="ML Framework" tooltip="Core ML libraries">
            <span className="text-sm text-gray-600">scikit-learn, pandas, numpy</span>
          </SettingsRow>
          <SettingsRow label="Server">
            <span className="text-sm font-mono text-gray-500">{config?.server_host || "127.0.0.1"}:{config?.server_port || 8000}</span>
          </SettingsRow>
          <SettingsRow label="Upload Retention">
            <span className="text-sm text-gray-600">{config?.upload_retention_days || 30} days</span>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}

export default SettingsPage;
