import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { datasetsAPI, dashboardAPI } from "../../services/api";
import { storageUtils } from "../utils/storageUtils";

const ALGORITHM_NAMES = {
  logistic: "Logistic Regression",
  tree: "Decision Tree",
  rf: "Random Forest",
  linear: "Linear Regression",
  tree_reg: "Decision Tree Regressor",
  rf_reg: "Random Forest Regressor"
};

const STAGE_LABELS = ["Upload", "EDA", "Preprocessing", "Training", "Comparison"];

function Section({ title, className, children }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className || ""}`}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ActivityIcon({ type }) {
  const icons = {
    upload: "📤",
    eda: "📊",
    preprocess: "⚙️",
    training: "🧠",
    comparison: "📋",
    ai: "🤖",
    feature_importance: "📈"
  };
  return <span className="text-base mr-3">{icons[type] || "📌"}</span>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const datasetId = storageUtils.getDatasetId();

  const [datasets, setDatasets] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // All application state loaded from backend APIs + in-memory caches
  const eda = storageUtils.getEDA(datasetId);
  const trainingResult = storageUtils.getPlaygroundResult(datasetId);
  const comparison = storageUtils.getComparisonResult(datasetId);
  const mlConfig = storageUtils.getMLConfig(datasetId);
  const preprocessConfig = storageUtils.getPreprocessConfig(datasetId);
  const activities = storageUtils.getActivities(datasetId);
  const fileName = storageUtils.getFileName();

  // AI copilot summary (from in-memory cache)
  const aiPages = ["upload", "insights", "playground", "comparison"];
  const hasAi = aiPages.some(p => storageUtils.getAiRecommendation(datasetId, p)?.status === "completed");
  const firstAiRecPage = aiPages.find(p => storageUtils.getAiRecommendation(datasetId, p)?.status === "completed");
  const aiData = firstAiRecPage ? storageUtils.getAiRecommendation(datasetId, firstAiRecPage)?.data : null;

  // Training history (append-only, each training is an experiment)
  const trainingHistory = datasetId ? storageUtils.getTrainingHistory(datasetId) : [];
  const lastExperiment = trainingHistory.length > 0 ? trainingHistory[trainingHistory.length - 1] : null;

  // Pipeline detection
  const pipeline = {
    upload: !!datasetId,
    eda: !!eda,
    preprocessing: !!preprocessConfig && Object.keys(preprocessConfig).length > 0,
    training: trainingHistory.length > 0 || !!trainingResult,
    comparison: !!comparison?.result
  };
  const completedStages = STAGE_LABELS.filter((_, i) => Object.values(pipeline)[i]);
  const currentStageIndex = Object.values(pipeline).findIndex(v => !v);

  // Best model from training history or comparison
  const bestExperiment = datasetId ? storageUtils.getBestModel(datasetId) : null;
  const bestMetrics = bestExperiment?.metrics || null;
  const bestAlgorithm = bestExperiment?.algorithm || mlConfig.algorithm || comparison?.best_model || "";
  const isClassification = (bestExperiment?.problem_type || mlConfig.problem_type) === "classification";

  // Leaderboard from comparison
  const leaderboard = comparison?.leaderboard || comparison?.result?.leaderboard || [];
  const topModels = [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Model count (from experiments cache)
  const totalTrained = datasetId ? (trainingHistory.length || 0) : 0;

  // Recent activities (last 10)
  const recentActivities = [...activities].reverse().slice(0, 10);

  // Latest 3 experiments for Recent Models display
  const recentModels = [...trainingHistory].reverse().slice(0, 3);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [dsRes, hRes, sessionRes] = await Promise.allSettled([
          datasetsAPI.list(),
          dashboardAPI.health(),
          datasetId ? storageUtils.syncDatasetSession(datasetId) : Promise.resolve(),
          datasetId ? storageUtils.syncExperiments(datasetId) : Promise.resolve(),
          datasetId ? storageUtils.syncComparison(datasetId) : Promise.resolve(),
          datasetId ? storageUtils.syncActivities(datasetId) : Promise.resolve()
        ]);
        if (cancelled) return;
        if (dsRes.status === "fulfilled") setDatasets(dsRes.value?.data || []);
        if (hRes.status === "fulfilled") setHealthStatus(hRes.value);
      } catch {}
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const backendCount = Array.isArray(datasets) ? datasets.length : 0;
  const hasDataset = !!datasetId && (!!eda || !!trainingResult || !!comparison || !!mlConfig.target_column);
  const datasetCount = backendCount > 0 ? backendCount : (hasDataset ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {hasDataset
                ? `Active dataset: ${fileName || datasetId}`
                : "No active dataset"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className={`inline-block w-2 h-2 rounded-full ${healthStatus?.services?.backend === "healthy" ? "bg-emerald-500" : "bg-red-500"}`} />
            <span>Backend {healthStatus?.services?.backend || "checking"}</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Datasets"
            value={datasetCount}
            color="text-blue-600"
          />
          <StatCard
            label="Pipeline Stage"
            value={currentStageIndex < 0 ? "Complete" : STAGE_LABELS[currentStageIndex] || "Start"}
            sub={hasDataset ? `${completedStages.length}/${STAGE_LABELS.length} done` : "No dataset"}
            color={currentStageIndex < 0 ? "text-emerald-600" : "text-amber-600"}
          />
          <StatCard
            label="Models Trained"
            value={totalTrained}
            sub={hasDataset ? (trainingHistory.length > 0 ? `${trainingHistory.length} experiment${trainingHistory.length !== 1 ? "s" : ""}` : "No model yet") : ""}
            color="text-purple-600"
          />
          <StatCard
            label="Best Accuracy"
            value={bestMetrics ? (isClassification ? `${(bestMetrics.accuracy * 100).toFixed(1)}%` : `R² ${bestMetrics.r2?.toFixed(3) || "N/A"}`) : "—"}
            sub={bestAlgorithm ? ALGORITHM_NAMES[bestAlgorithm] || bestAlgorithm : ""}
            color={bestMetrics ? "text-emerald-600" : "text-gray-400"}
          />
          <StatCard
            label="AI Copilot"
            value={hasAi ? "Active" : "Inactive"}
            sub={hasAi ? "Recommendations ready" : (storageUtils.getAiSettings()?.mode === "ai" ? "Waiting" : "Disabled")}
            color={hasAi ? "text-indigo-600" : "text-gray-400"}
          />
          <StatCard
            label="Latest Experiment"
            value={lastExperiment ? formatTime(lastExperiment.timestamp) : "—"}
            sub={lastExperiment ? `${ALGORITHM_NAMES[lastExperiment.algorithm] || lastExperiment.algorithm} — ${new Date(lastExperiment.timestamp).toLocaleDateString()}` : "No experiments"}
            color={lastExperiment ? "text-gray-900" : "text-gray-400"}
          />
        </div>

        {/* Pipeline + Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Progress */}
          <Section title="Pipeline Progress" className="lg:col-span-2">
            {!hasDataset ? (
              <p className="text-sm text-gray-400 py-4 text-center">Upload a dataset to begin the pipeline.</p>
            ) : (
              <div className="flex items-center gap-2 py-2 flex-wrap">
                {STAGE_LABELS.map((label, i) => {
                  const done = Object.values(pipeline)[i];
                  const isCurrent = i === currentStageIndex;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        done
                          ? "bg-emerald-100 text-emerald-700"
                          : isCurrent
                            ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                            : "bg-gray-100 text-gray-400"
                      }`}>
                        <span>{done ? "✓" : isCurrent ? "●" : "○"}</span>
                        <span>{label}</span>
                      </div>
                      {i < STAGE_LABELS.length - 1 && (
                        <div className={`w-6 h-0.5 ${done ? "bg-emerald-300" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {hasDataset && (
              <div className="mt-3 text-xs text-gray-400">
                {currentStageIndex < 0
                  ? "All stages completed. Run comparison or retrain models."
                  : `Next: ${STAGE_LABELS[currentStageIndex]} — ${getStageHint(currentStageIndex)}`}
              </div>
            )}
          </Section>

          {/* Dataset Health */}
          <Section title="Dataset Health">
            {!eda ? (
              <p className="text-sm text-gray-400 py-4 text-center">Run EDA to see health metrics.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <HealthRow label="Rows" value={eda.overview?.rows} />
                <HealthRow label="Columns" value={eda.overview?.columns} />
                <HealthRow label="Missing" value={eda.overview?.missing_percentage != null ? `${eda.overview.missing_percentage.toFixed(1)}%` : "—"} warn={eda.overview?.missing_percentage > 5} />
                <HealthRow label="Duplicates" value={eda.overview?.duplicates ?? "—"} warn={eda.overview?.duplicates > 0} />
                <HealthRow label="Target" value={mlConfig.target_column || "Not selected"} />
                <HealthRow label="Problem Type" value={mlConfig.problem_type || "—"} />
                {eda.column_types && (
                  <HealthRow label="Features" value={`${eda.column_types.length} total`} />
                )}
              </div>
            )}
          </Section>
        </div>

        {/* AI Copilot Summary */}
        <Section title="AI Copilot Summary">
          {!hasDataset ? (
            <p className="text-sm text-gray-400 py-4 text-center">Upload a dataset to see AI recommendations.</p>
          ) : !hasAi ? (
            <div className="text-sm text-gray-400 py-4 text-center">
              {storageUtils.getAiSettings()?.mode === "ai"
                ? "AI recommendations will appear once generated."
                : "Enable AI mode on the Upload page to get AI-powered recommendations."}
            </div>
          ) : aiData ? (
            <div className="text-sm text-gray-700 leading-relaxed max-w-3xl">
              {typeof aiData === "string" ? aiData : JSON.stringify(aiData).slice(0, 500)}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-2">AI analysis available. Visit individual pages to view.</p>
          )}
        </Section>

        {/* Best Model + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Best Model">
            {!bestMetrics ? (
              <p className="text-sm text-gray-400 py-4 text-center">No trained models yet.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">{ALGORITHM_NAMES[bestAlgorithm] || bestAlgorithm}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{mlConfig.problem_type || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {isClassification ? (
                    <>
                      <Metric label="Accuracy" value={`${(bestMetrics.accuracy * 100).toFixed(1)}%`} />
                      <Metric label="Precision" value={bestMetrics.precision?.toFixed(3)} />
                      <Metric label="Recall" value={bestMetrics.recall?.toFixed(3)} />
                      <Metric label="F1 Score" value={bestMetrics.f1?.toFixed(3)} />
                    </>
                  ) : (
                    <>
                      <Metric label="R² Score" value={bestMetrics.r2?.toFixed(3)} />
                      <Metric label="RMSE" value={bestMetrics.rmse?.toFixed(3)} />
                    </>
                  )}
                </div>
                {bestExperiment?.timestamp && (
                  <p className="text-xs text-gray-400 pt-1">Trained {formatTime(bestExperiment.timestamp)}</p>
                )}
              </div>
            )}
          </Section>

          <Section title="Model Leaderboard">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No comparison available.</p>
            ) : (
              <div className="space-y-2">
                {topModels.map((m, i) => (
                  <div key={m.model} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-600" : i === 2 ? "bg-amber-700 text-white" : "bg-gray-200 text-gray-500"
                      }`}>{i + 1}</span>
                      <span className="font-medium text-gray-800">{m.model}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{(m.score * 100).toFixed(1)}%</span>
                      <span className="text-xs text-gray-400 ml-1">±{m.std?.toFixed(3) || "—"}</span>
                    </div>
                  </div>
                ))}
                {comparison?.timestamp && (
                  <p className="text-xs text-gray-400 pt-1">Compared {formatTime(comparison.timestamp)}</p>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Recent Models */}
        {recentModels.length > 0 && (
          <Section title="Recent Models">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentModels.map((exp) => (
                <div key={exp.experiment_id} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">{ALGORITHM_NAMES[exp.algorithm] || exp.algorithm}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{exp.problem_type}</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    {exp.metrics.accuracy != null && <p>Accuracy: {(exp.metrics.accuracy * 100).toFixed(1)}%</p>}
                    {exp.metrics.f1 != null && <p>F1: {exp.metrics.f1.toFixed(3)}</p>}
                    {exp.metrics.r2 != null && <p>R²: {exp.metrics.r2.toFixed(3)}</p>}
                    {exp.metrics.rmse != null && <p>RMSE: {exp.metrics.rmse.toFixed(3)}</p>}
                    <p className="text-gray-400">{formatTime(exp.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Recent Activity + Platform Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Section title="Recent Activity" className="lg:col-span-2">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No activity recorded yet.</p>
            ) : (
              <div className="space-y-0 divide-y divide-gray-100">
                {recentActivities.map((a, i) => (
                  <div key={i} className="flex items-start py-3 text-sm">
                    <ActivityIcon type={a.type} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{a.title}</p>
                      {a.description && <p className="text-xs text-gray-400 truncate">{a.description}</p>}
                    </div>
                    <span className="text-xs text-gray-400 ml-3 whitespace-nowrap">{formatTime(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Platform Status">
            <div className="space-y-3 text-sm">
              <StatusRow label="Backend" status={healthStatus?.services?.backend} />
              <StatusRow label="MongoDB" status={healthStatus?.services?.mongodb} />
              <StatusRow label="AI Service" status={healthStatus?.services?.ai_service} />
              <StatusRow label="Cache" status={healthStatus?.services?.dataset_cache} />
              <StatusRow label="API Version" status={healthStatus?.version || "—"} />
            </div>
          </Section>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              label={hasDataset ? "Continue Training" : "Upload Dataset"}
              onClick={() => navigate(hasDataset ? `/playground/${datasetId}` : "/upload")}
              primary
              disabled={hasDataset && !mlConfig.target_column}
            />
            <ActionButton
              label="Upload Dataset"
              onClick={() => navigate("/upload")}
              disabled={false}
            />
            <ActionButton
              label="Open Insights"
              onClick={() => navigate(`/insights/${datasetId}`)}
              disabled={!hasDataset}
            />
            <ActionButton
              label="Compare Models"
              onClick={() => navigate(`/comparison/${datasetId}`)}
              disabled={!hasDataset || trainingHistory.length === 0}
            />
            <ActionButton
              label="Settings"
              onClick={() => navigate("/settings")}
              disabled={false}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function HealthRow({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${warn ? "text-red-600" : "text-gray-800"}`}>{value ?? "—"}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-900">{value ?? "—"}</p>
    </div>
  );
}

function StatusRow({ label, status }) {
  const colorMap = {
    healthy: "bg-emerald-500",
    ok: "bg-emerald-500",
    unhealthy: "bg-red-500",
    available: "bg-emerald-500",
    unavailable: "bg-red-500",
    empty: "bg-gray-300"
  };
  const dot = colorMap[status] || "bg-gray-300";
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        <span className="font-medium text-gray-700 text-xs capitalize">{status || "unknown"}</span>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, primary, disabled }) {
  if (disabled) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function getStageHint(index) {
  const hints = [
    "Upload a CSV dataset to begin.",
    "Run EDA on the Data Insights page.",
    "Configure preprocessing options.",
    "Train a model in the ML Playground.",
    "Compare models to find the best performer."
  ];
  return hints[index] || "";
}
