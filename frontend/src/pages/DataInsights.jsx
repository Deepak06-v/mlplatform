import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";

import OverviewCards from "../components/DataInsights/OverviewCards";
import MissingValuesChart from "../components/DataInsights/MissingValuesChart";
import NumericalAnalysis from "../components/DataInsights/NumericalAnalysis";
import CategoricalAnalysis from "../components/DataInsights/CategoricalAnalysis";
import CorrelationHeatmap from "../components/DataInsights/CorrelationHeatmap";
import FeatureImportance from "../components/DataInsights/FeatureImportance";
import { generateInsights } from "../utils/insightEngine";
import InsightPanel from "../components/DataInsights/InsightPanel";
import { generateRecommendations } from "../utils/RecommendationEngine";
import RecommendationPanel from "../components/DataInsights/RecommendationPanel";
import { analyzeTarget } from "../utils/taregtAnalysis";
import TargetInsights from "../components/DataInsights/TargetInsights";
import { getModelRecommendations } from "../utils/ModelRecommendation";
import ModelRecommendations from "../components/DataInsights/ModelRecommendations";
import { interpretFeatureImportance } from "../utils/explainanbility";
import ExplainabilityPanel from "../components/DataInsights/Explainability";

import { edaAPI } from "../../services/api";
import { storageUtils } from "../utils/storageUtils";
import { useAsync } from "../hooks/useAsync";
import { useAiRecommendation } from "../hooks/useAiRecommendation";
import { useNotification } from "../contexts/NotificationContext";
import { useSession } from "../contexts/SessionContext";
import { useWorkspace } from "../contexts/WorkspaceContext";

function DataInsights() {
  const { dataset_id } = useParams();
  const { notify } = useNotification();
  const { session: globalSession, updateSession } = useSession();
  const { state: wsState } = useWorkspace();
  const [insights, setInsights] = useState([]);
  const [edaData, setEdaData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [targetInfo, setTargetInfo] = useState(null);
  const [modelRecs, setModelRecs] = useState([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const edaFromCache = useRef(false);
  const fiFromCache = useRef(false);

  const targetColumn = globalSession?.target_column || "";

  const fiAsync = useAsync(() =>
    targetColumn ? edaAPI.computeFeatureImportance(dataset_id, targetColumn) : Promise.resolve([])
  );

  const cachedEDA = wsState?.eda || storageUtils.getEDA(dataset_id);

  useEffect(() => {
    if (!dataset_id) return;
    if (cachedEDA) {
      edaFromCache.current = true;
      setEdaData(cachedEDA);
      return;
    }
    edaAPI.analyze(dataset_id).then(res => {
      const data = res?.data || res;
      storageUtils.saveEDA(dataset_id, data);
      setEdaData(data);
    }).catch(() => {});
  }, [dataset_id, cachedEDA]);

  useEffect(() => {
    if (!targetColumn || !dataset_id) return;
    const cachedFI = wsState?.feature_importance || storageUtils.getFeatureImportance(dataset_id, targetColumn);
    if (cachedFI) {
      fiFromCache.current = true;
      fiAsync.setData(cachedFI);
      return;
    }
    fiAsync.execute();
  }, [targetColumn, dataset_id, wsState?.feature_importance]);

  useEffect(() => {
    if (fiFromCache.current) {
      fiFromCache.current = false;
      return;
    }
    if (fiAsync.isSuccess && fiAsync.data && dataset_id && targetColumn) {
      storageUtils.saveFeatureImportance(dataset_id, targetColumn, fiAsync.data);
      if (!fiAsync.data.from_cache) {
        storageUtils.addActivity(dataset_id, {
          type: "feature_importance",
          title: "Feature importance computed",
          description: `Target: ${targetColumn}`
        });
        notify.success("Feature importance computed", "Ready for analysis");
      }
    }
  }, [fiAsync.isSuccess, fiAsync.data, dataset_id, targetColumn]);

  const data = edaData?.data || edaData;

  useEffect(() => {
    if (data) {
      const generated = generateInsights(data, targetColumn);
      setInsights(generated);
    }
  }, [data, targetColumn]);

  useEffect(() => {
    if (insights.length > 0) {
      const recs = generateRecommendations(insights);
      setRecommendations(recs);
    }
  }, [insights]);

  useEffect(() => {
    if (data && targetColumn) {
      const info = analyzeTarget(data, targetColumn);
      setTargetInfo(info);
    }
  }, [data, targetColumn]);

  useEffect(() => {
    if (targetInfo) {
      const models = getModelRecommendations(targetInfo, data);
      setModelRecs(models);
    }
  }, [targetInfo, data]);

  useEffect(() => {
    if (dataset_id) {
      const settings = storageUtils.getAiSettings();
      setAiEnabled(settings.mode === "ai");
    }
  }, [dataset_id]);

  const insightAi = useAiRecommendation({
    datasetId: dataset_id,
    page: "insights",
    store: storageUtils,
    enabled: aiEnabled
  });

  const aiInsightData = insightAi.aiResult?.data;
  const aiStatus = insightAi.aiStatus;

  const handleTargetChange = useCallback((column) => {
    updateSession({ target_column: column });
  }, [updateSession]);

  if (!edaData && !cachedEDA) {
    return <div className="p-6">Loading insights...</div>;
  }

  if (!data) {
    return <div className="p-6">No data available</div>;
  }

  const featureImportanceData = fiAsync.data?.data || fiAsync.data?.importance || fiAsync.data || [];
  const explainInsights = interpretFeatureImportance(featureImportanceData);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Insights Dashboard</h1>
          <p className="text-gray-600">Analyze dataset structure, quality, and model readiness</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <OverviewCards overview={data.overview} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <MissingValuesChart data={data.missing} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <NumericalAnalysis data={data.numerical} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <CategoricalAnalysis data={data.categorical} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <CorrelationHeatmap data={data.correlation} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <InsightPanel
            insights={insights}
            aiData={aiInsightData?.insights}
            aiStatus={aiStatus}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <RecommendationPanel
            recommendations={recommendations}
            aiData={aiInsightData?.recommendations}
            aiStatus={aiStatus}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <TargetInsights
            targetInfo={targetInfo}
            targetColumn={targetColumn}
            aiData={aiInsightData?.target_analysis}
            aiStatus={aiStatus}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <ModelRecommendations
            models={modelRecs}
            aiData={aiInsightData?.model_suggestions}
            aiStatus={aiStatus}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Feature Importance</h2>

          <div className="flex gap-3 mb-6">
            <select
              value={targetColumn}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Target Column</option>
              {data.column_types?.map((col, i) => (
                <option key={i} value={col.column}>
                  {col.column}
                </option>
              ))}
            </select>

            <button
              onClick={() => fiAsync.execute()}
              disabled={!targetColumn || fiAsync.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {fiAsync.isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {fiAsync.isLoading ? (
            <p className="text-gray-600">Computing feature importance...</p>
          ) : fiAsync.isError ? (
            <p className="text-red-600">Error: {fiAsync.error}</p>
          ) : (
            <FeatureImportance data={featureImportanceData} />
          )}

          <ExplainabilityPanel
            insights={explainInsights}
            aiData={aiInsightData?.explainability}
            aiStatus={aiStatus}
          />
        </div>
      </div>
    </div>
  );
}

export default DataInsights;
