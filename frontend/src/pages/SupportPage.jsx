import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Activity, CheckCircle, XCircle, AlertTriangle, Download, FileText,
  Bug, Lightbulb, ClipboardList, MessageSquare, LifeBuoy, Info,
  Server, Database, Zap, HardDrive, Cpu, Clock, RefreshCw, Search,
  ChevronDown, ChevronRight, ExternalLink, Github, Mail, Linkedin,
  Globe, UploadCloud, FlaskConical, Settings, BookOpen, GitCompare,
  LayoutDashboard, Loader, AlertCircle, Filter,
} from "lucide-react";
import { monitoringAPI, settingsAPI, activityAPI, cleanupAPI } from "../../services/api";
import { useSession } from "../contexts/SessionContext";
import { useNotification } from "../contexts/NotificationContext";
import {
  SUPPORT_FAQS, TROUBLESHOOTING_GUIDES, CONTACT_INFO,
  SEVERITY_OPTIONS, BUG_CATEGORIES, FEATURE_PRIORITIES, FEATURE_CATEGORIES,
} from "../data/support-content";

const ICON_MAP = {
  UploadCloud, FlaskConical, Settings, BookOpen, GitCompare,
  LayoutDashboard, Database, Zap, RefreshCw, Server,
};

function StatusDot({ status }) {
  const colorMap = { healthy: "bg-green-500", unhealthy: "bg-red-500", warning: "bg-amber-500", empty: "bg-gray-400", available: "bg-green-500", unavailable: "bg-red-500" };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colorMap[status] || "bg-gray-400"} shrink-0`} />;
}

function StatusCard({ label, status, sub, icon: Icon }) {
  const labelMap = { healthy: "Healthy", unhealthy: "Offline", warning: "Warning", empty: "Empty", available: "Available", unavailable: "Unavailable" };
  const colorMap = { healthy: "text-green-600", unhealthy: "text-red-600", warning: "text-amber-600", empty: "text-gray-500", available: "text-green-600", unavailable: "text-red-600" };
  const bgMap = { healthy: "bg-green-50 border-green-200", unhealthy: "bg-red-50 border-red-200", warning: "bg-amber-50 border-amber-200", empty: "bg-gray-50 border-gray-200", available: "bg-green-50 border-green-200", unavailable: "bg-red-50 border-red-200" };
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${bgMap[status] || "bg-gray-50 border-gray-200"}`}>
      {Icon && <Icon className={`w-5 h-5 ${colorMap[status] || "text-gray-500"} shrink-0`} />}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
        <p className={`text-xs font-semibold ${colorMap[status] || "text-gray-500"}`}>{labelMap[status] || status || "Unknown"}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function formatNumber(n) {
  if (n == null) return "—";
  if (typeof n === "number") return n.toLocaleString();
  return n;
}

function SectionCard({ title, icon: Icon, description, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== false);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-indigo-500 shrink-0" />}
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            {description && <p className="text-xs text-gray-400">{description}</p>}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-50">{children}</div>}
    </div>
  );
}

function SupportPage() {
  const { notify } = useNotification();
  const { session, dataset, datasetId } = useSession();
  const refreshRef = useRef(null);

  // Health data
  const [health, setHealth] = useState(null);
  const [memory, setMemory] = useState(null);
  const [storage, setStorage] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [config, setConfig] = useState(null);
  const [versionInfo, setVersionInfo] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bug report form
  const [bugForm, setBugForm] = useState({ title: "", category: "", severity: "Medium", description: "", steps: "", expected: "", actual: "" });
  const [bugExport, setBugExport] = useState(null);

  // Feature request form
  const [featureForm, setFeatureForm] = useState({ title: "", description: "", priority: "Medium", category: "" });

  // Logs filter
  const [logFilter, setLogFilter] = useState("all");
  const [faqSearch, setFaqSearch] = useState("");
  const [troubleshootingSearch, setTroubleshootingSearch] = useState("");

  // Fetch all data
  const fetchAll = useCallback(async () => {
    try {
      const [h, m, s, c, mt, cfg, v] = await Promise.allSettled([
        monitoringAPI.health(),
        monitoringAPI.healthMemory(),
        monitoringAPI.healthStorage(),
        monitoringAPI.healthCache(),
        monitoringAPI.metrics(),
        settingsAPI.config(),
        monitoringAPI.version(),
      ]);
      if (h.status === "fulfilled") setHealth(h.value);
      if (m.status === "fulfilled") setMemory(m.value);
      if (s.status === "fulfilled") setStorage(s.value);
      if (c.status === "fulfilled") setCacheInfo(c.value);
      if (mt.status === "fulfilled") setMetrics(mt.value);
      if (cfg.status === "fulfilled") setConfig(cfg.value);
      if (v.status === "fulfilled") setVersionInfo(v.value);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      const res = await activityAPI.listAll(50);
      if (res?.data) setActivities(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
    fetchActivities();
    refreshRef.current = setInterval(() => { fetchAll(); fetchActivities(); }, 15000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchAll, fetchActivities]);

  // Health summary
  const services = health?.services || {};
  const backendStatus = services.backend === "healthy" ? "healthy" : "unhealthy";
  const mongoStatus = services.mongodb === "healthy" ? "healthy" : "unhealthy";
  const aiStatus = services.ai_service === "available" ? "healthy" : (services.ai_service === "unavailable" ? "unhealthy" : "warning");
  const dsCacheStatus = cacheInfo?.dataset_cache?.entries > 0 ? "healthy" : "empty";
  const aiCacheStatus = cacheInfo?.ai_cache?.entries > 0 ? "healthy" : "empty";
  const storageHealthy = storage?.total_files > 0 ? "healthy" : "empty";

  const healthSummary = [
    { label: "Backend", status: backendStatus, icon: Server },
    { label: "MongoDB", status: mongoStatus, icon: Database },
    { label: "AI Service", status: aiStatus, icon: Zap },
    { label: "Dataset Cache", status: dsCacheStatus, icon: HardDrive, sub: `${cacheInfo?.dataset_cache?.entries || 0} entries` },
    { label: "AI Cache", status: aiCacheStatus, icon: Zap, sub: `${cacheInfo?.ai_cache?.entries || 0} entries` },
    { label: "Storage", status: storageHealthy, icon: Server, sub: storage?.total_files ? `${storage.total_files} files` : "Empty" },
  ];

  // Diagnostics
  const buildDiagnostics = () => ({
    generated_at: new Date().toISOString(),
    application: {
      version: config?.version || "1.0.0",
      build: config?.build || "unknown",
      mode: config?.server_mode || "development",
      python_version: versionInfo?.python_version || "—",
    },
    backend: {
      status: backendStatus,
      uptime_seconds: health?.uptime_seconds || 0,
      started_at: versionInfo?.started_at || 0,
    },
    mongodb: { status: mongoStatus },
    ai_service: { status: aiStatus, provider_configured: services.ai_service === "available" },
    storage: {
      total_files: storage?.total_files || 0,
      total_size_mb: storage?.total_size_mb || 0,
      datasets: storage?.datasets || 0,
      experiments: storage?.experiments || 0,
      sessions: storage?.sessions || 0,
    },
    cache: {
      dataset: { entries: cacheInfo?.dataset_cache?.entries || 0, memory_mb: cacheInfo?.dataset_cache?.memory_mb || 0, hits: cacheInfo?.dataset_cache?.hits || 0, misses: cacheInfo?.dataset_cache?.misses || 0 },
      ai: { entries: cacheInfo?.ai_cache?.entries || 0, hits: cacheInfo?.ai_cache?.hits || 0, misses: cacheInfo?.ai_cache?.misses || 0 },
    },
    memory: {
      process_memory_mb: memory?.process_memory_mb || 0,
      cache_memory_mb: memory?.cache_memory_mb || 0,
    },
    metrics: {
      datasets_uploaded: metrics?.datasets_uploaded || 0,
      experiments_created: metrics?.experiments_created || 0,
      comparisons: metrics?.comparisons || 0,
      ai_requests: metrics?.ai_requests || 0,
      cache_hit_rate: metrics?.cache_hit_rate || 0,
    },
    session: {
      active: !!datasetId,
      dataset_id: datasetId || null,
      dataset_filename: dataset?.filename || null,
      target_column: session?.target_column || null,
    },
    frontend: {
      user_agent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    },
  });

  const handleExportDiagnostics = () => {
    const data = buildDiagnostics();
    downloadJSON(data, "diagnostics-report.json");
    notify.success("Diagnostics exported", "System diagnostics downloaded");
  };

  const handleExportBugReport = () => {
    const diagnostics = buildDiagnostics();
    const report = {
      ...bugForm,
      steps_to_reproduce: bugForm.steps,
      expected_result: bugForm.expected,
      actual_result: bugForm.actual,
      system_info: {
        app_version: config?.version || "—",
        backend_version: config?.version || "—",
        frontend_version: "0.0.0",
        build: config?.build || "—",
        mode: config?.server_mode || "—",
        dataset_id: datasetId || null,
        session_active: !!datasetId,
        browser: navigator.userAgent,
        os: navigator.platform,
      },
      generated_at: new Date().toISOString(),
    };
    downloadJSON(report, "bug-report.json");
    setBugExport(report);
    notify.success("Bug report exported", "Includes all system information");
  };

  const handleExportSystemStatus = () => {
    const data = {
      exported_at: new Date().toISOString(),
      health_summary: healthSummary,
      health_full: health,
      memory,
      storage,
      cache: cacheInfo,
      metrics,
      config,
    };
    downloadJSON(data, "system-status.json");
    notify.success("System status exported", "Complete status snapshot downloaded");
  };

  const handleExportLogs = () => {
    if (activities.length === 0) { notify.warning("No logs", "No recent activities to export"); return; }
    let data = activities;
    if (logFilter !== "all") data = activities.filter((a) => (a.activity_type || "other") === logFilter);
    downloadJSON(data, "activity-logs.json");
    notify.success("Logs exported", `${data.length} log entries downloaded`);
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleBugSubmit = (e) => {
    e.preventDefault();
    if (!bugForm.title || !bugForm.description) { notify.error("Incomplete form", "Title and description are required"); return; }
    handleExportBugReport();
    setBugForm({ title: "", category: "", severity: "Medium", description: "", steps: "", expected: "", actual: "" });
    notify.success("Bug report saved", "Report has been generated and downloaded");
  };

  const handleFeatureSubmit = (e) => {
    e.preventDefault();
    if (!featureForm.title || !featureForm.description) { notify.error("Incomplete form", "Title and description are required"); return; }
    downloadJSON({ ...featureForm, submitted_at: new Date().toISOString() }, "feature-request.json");
    setFeatureForm({ title: "", description: "", priority: "Medium", category: "" });
    notify.success("Feature request saved", "Your request has been submitted");
  };

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return SUPPORT_FAQS;
    const q = faqSearch.toLowerCase();
    return SUPPORT_FAQS.map((cat) => ({
      ...cat,
      items: cat.items.filter((i) => i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0);
  }, [faqSearch]);

  const filteredTroubleshooting = useMemo(() => {
    if (!troubleshootingSearch.trim()) return TROUBLESHOOTING_GUIDES;
    const q = troubleshootingSearch.toLowerCase();
    return TROUBLESHOOTING_GUIDES.filter(
      (g) => g.title.toLowerCase().includes(q) || g.symptoms.toLowerCase().includes(q) ||
        g.causes.some((c) => c.toLowerCase().includes(q)) || g.solutions.some((s) => s.toLowerCase().includes(q))
    );
  }, [troubleshootingSearch]);

  const logTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.activity_type || "other"));
    return ["all", ...Array.from(types)];
  }, [activities]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <LifeBuoy className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
          </div>
        </div>
        <p className="text-sm text-gray-500 -mt-3 mb-2">System health, diagnostics, and help resources</p>

        {/* ===== 1. System Status ===== */}
        <SectionCard title="System Status" icon={Activity} description="Live system health (auto-refreshes every 15s)">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {healthSummary.map((item, i) => <StatusCard key={i} {...item} />)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Memory</p>
                  <p className="text-sm font-semibold text-gray-800">{memory?.process_memory_mb != null ? `${memory.process_memory_mb} MB` : "—"}</p>
                  <p className="text-[10px] text-gray-400">Process</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Cache Memory</p>
                  <p className="text-sm font-semibold text-gray-800">{memory?.cache_memory_mb != null ? `${memory.cache_memory_mb} MB` : "—"}</p>
                  <p className="text-[10px] text-gray-400">In-memory cache</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Storage</p>
                  <p className="text-sm font-semibold text-gray-800">{storage?.total_size_mb != null ? `${storage.total_size_mb} MB` : "—"}</p>
                  <p className="text-[10px] text-gray-400">{storage?.total_files || 0} files</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">System Uptime</p>
                  <p className="text-sm font-semibold text-gray-800">{formatUptime(health?.uptime_seconds)}</p>
                  <p className="text-[10px] text-gray-400">Backend server</p>
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ===== 2. Health Summary ===== */}
        <SectionCard title="Health Summary" icon={CheckCircle} description="Service status overview">
          <div className="flex flex-wrap gap-3">
            {healthSummary.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100">
                <StatusDot status={item.status} />
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ===== 3. Diagnostics ===== */}
        <SectionCard title="Diagnostics" icon={FileText} description="Generate and export system diagnostics">
          <p className="text-sm text-gray-600 mb-4">Download a comprehensive diagnostics report including all system health data, version information, and session state.</p>
          <button onClick={handleExportDiagnostics} className="flex items-center gap-2 text-sm px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors font-medium">
            <Download className="w-4 h-4" /> Export Diagnostics Report
          </button>
        </SectionCard>

        {/* ===== 4. Bug Report ===== */}
        <SectionCard title="Bug Report" icon={Bug} description="Report a bug or issue">
          <form onSubmit={handleBugSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={bugForm.title} onChange={(e) => setBugForm((f) => ({ ...f, title: e.target.value }))} placeholder="Brief bug description" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={bugForm.category} onChange={(e) => setBugForm((f) => ({ ...f, category: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select category</option>
                  {BUG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                <select value={bugForm.severity} onChange={(e) => setBugForm((f) => ({ ...f, severity: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
                  {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={bugForm.description} onChange={(e) => setBugForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the bug in detail" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Steps to Reproduce</label>
                <textarea value={bugForm.steps} onChange={(e) => setBugForm((f) => ({ ...f, steps: e.target.value }))} rows={2} placeholder="1. Go to... 2. Click... 3. See error" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Expected Result</label>
                <textarea value={bugForm.expected} onChange={(e) => setBugForm((f) => ({ ...f, expected: e.target.value }))} rows={2} placeholder="What should happen" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Actual Result</label>
                <textarea value={bugForm.actual} onChange={(e) => setBugForm((f) => ({ ...f, actual: e.target.value }))} rows={2} placeholder="What actually happened" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className="flex items-center gap-2 text-sm px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors font-medium">
                <Bug className="w-4 h-4" /> Generate & Export Report
              </button>
              <span className="text-xs text-gray-400">Auto-includes system info, version, and session data</span>
            </div>
          </form>
        </SectionCard>

        {/* ===== 5. Feature Request ===== */}
        <SectionCard title="Feature Request" icon={Lightbulb} description="Suggest a new feature">
          <form onSubmit={handleFeatureSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={featureForm.title} onChange={(e) => setFeatureForm((f) => ({ ...f, title: e.target.value }))} placeholder="Feature name" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={featureForm.category} onChange={(e) => setFeatureForm((f) => ({ ...f, category: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select category</option>
                  {FEATURE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select value={featureForm.priority} onChange={(e) => setFeatureForm((f) => ({ ...f, priority: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
                  {FEATURE_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={featureForm.description} onChange={(e) => setFeatureForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the feature and its benefits" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <button type="submit" className="flex items-center gap-2 text-sm px-4 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-medium">
              <Lightbulb className="w-4 h-4" /> Submit Feature Request
            </button>
          </form>
        </SectionCard>

        {/* ===== 6. Logs ===== */}
        <SectionCard title="Recent Activities" icon={ClipboardList} description="Recent application events (auto-refreshes)">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select value={logFilter} onChange={(e) => setLogFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500">
                {logTypes.map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
              </select>
              <span className="text-xs text-gray-400">{activities.length} events</span>
            </div>
            <button onClick={handleExportLogs} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          {activities.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <ClipboardList className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No recent activities found</p>
              <p className="text-xs">Activities appear as you interact with the platform</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {activities.filter((a) => logFilter === "all" || a.activity_type === logFilter).slice(0, 50).map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.severity === "error" ? "bg-red-500" : a.severity === "warning" ? "bg-amber-500" : "bg-indigo-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-700 truncate">{a.title || a.activity_type || "Event"}</p>
                    {a.description && <p className="text-gray-400 truncate">{a.description}</p>}
                  </div>
                  <span className="text-gray-400 whitespace-nowrap shrink-0">{formatTimestamp(a.created_at || a.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ===== 7. FAQ ===== */}
        <SectionCard title="FAQ" icon={MessageSquare} description="Quick answers to common questions">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={faqSearch} onChange={(e) => setFaqSearch(e.target.value)} placeholder="Search FAQs..." className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500" />
          </div>
          {filteredFaqs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No FAQs match your search</p>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((cat, i) => (
                <div key={i}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat.category}</h4>
                  <div className="space-y-1">
                    {cat.items.map((faq, j) => (
                      <FaqAccordion key={j} question={faq.question} answer={faq.answer} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ===== 8. Troubleshooting ===== */}
        <SectionCard title="Troubleshooting" icon={AlertTriangle} description="Guides for common issues">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={troubleshootingSearch} onChange={(e) => setTroubleshootingSearch(e.target.value)} placeholder="Search troubleshooting guides..." className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500" />
          </div>
          {filteredTroubleshooting.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No guides match your search</p>
          ) : (
            <div className="space-y-3">
              {filteredTroubleshooting.map((guide) => (
                <TroubleshootingCard key={guide.id} guide={guide} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* ===== 9. Contact ===== */}
        <SectionCard title="Contact" icon={MessageSquare} description="Get in touch with the team">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <a href={CONTACT_INFO.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <Github className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              <div><p className="text-sm font-medium text-gray-700">GitHub</p><p className="text-xs text-gray-400">Source code</p></div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-indigo-500" />
            </a>
            <a href={CONTACT_INFO.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <Linkedin className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              <div><p className="text-sm font-medium text-gray-700">LinkedIn</p><p className="text-xs text-gray-400">Company page</p></div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-indigo-500" />
            </a>
            <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <Mail className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              <div><p className="text-sm font-medium text-gray-700">Email</p><p className="text-xs text-gray-400">{CONTACT_INFO.email}</p></div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-indigo-500" />
            </a>
            <a href={CONTACT_INFO.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <Globe className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              <div><p className="text-sm font-medium text-gray-700">Portfolio</p><p className="text-xs text-gray-400">Website</p></div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-indigo-500" />
            </a>
            <a href={CONTACT_INFO.documentation} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all group col-span-1 sm:col-span-2 lg:col-span-4">
              <BookOpen className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              <div><p className="text-sm font-medium text-gray-700">Documentation</p><p className="text-xs text-gray-400">Full user guide and knowledge base</p></div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-indigo-500" />
            </a>
          </div>
        </SectionCard>

        {/* ===== 10. Version Information ===== */}
        <SectionCard title="Version Information" icon={Info} description="Application and environment details">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">App Version</p>
              <p className="text-sm font-semibold text-gray-800">{config?.version || "1.0.0"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Build</p>
              <p className="text-sm font-mono text-gray-700">{config?.build || "unknown"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Backend Mode</p>
              <p className="text-sm font-semibold text-gray-800">{config?.server_mode || "development"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Python</p>
              <p className="text-sm font-semibold text-gray-800">{versionInfo?.python_version || "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Frontend</p>
              <p className="text-sm font-semibold text-gray-800">React + Vite</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Database</p>
              <p className="text-sm font-semibold text-gray-800">MongoDB</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Server</p>
              <p className="text-sm font-semibold text-gray-800 font-mono">{config?.server_host || "127.0.0.1"}:{config?.server_port || 8000}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Started</p>
              <p className="text-sm font-semibold text-gray-800">{versionInfo?.started_at ? new Date(versionInfo.started_at * 1000).toLocaleString() : "—"}</p>
            </div>
          </div>
        </SectionCard>

        {/* Export Tools */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" /> Export Tools
          </h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportDiagnostics} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium">
              <FileText className="w-3.5 h-3.5" /> Export Diagnostics
            </button>
            <button onClick={handleExportSystemStatus} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
              <Activity className="w-3.5 h-3.5" /> Export System Status
            </button>
            <button onClick={handleExportLogs} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium">
              <ClipboardList className="w-3.5 h-3.5" /> Export Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqAccordion({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
        <span className="font-medium">{question}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3 pb-3 text-xs text-gray-600 leading-relaxed">{answer}</div>}
    </div>
  );
}

function TroubleshootingCard({ guide }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-800">{guide.title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Symptoms</p>
            <p className="text-xs text-gray-500">{guide.symptoms}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 mb-1">Common Causes</p>
            <ul className="list-disc pl-4 text-xs text-gray-600 space-y-0.5">{guide.causes.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-green-600 mb-1">Solutions</p>
            <ol className="list-decimal pl-4 text-xs text-gray-600 space-y-0.5">{guide.solutions.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
        </div>
      )}
    </div>
  );
}

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

function formatTimestamp(val) {
  if (!val) return "";
  const ms = typeof val === "number" ? val * 1000 : new Date(val).getTime();
  if (isNaN(ms)) return "";
  const d = new Date(ms);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export default SupportPage;
