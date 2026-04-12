import { useEffect, useState, useCallback } from "react";
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

function DataInsights() {
  const { dataset_id } = useParams();
  const [insights, setInsights] = useState([]);
  const [edaData, setEdaData] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [targetInfo, setTargetInfo] = useState(null);
  const [modelRecs, setModelRecs] = useState([]);

  // Fetch EDA data
  const edaAsync = useAsync(() => edaAPI.analyze(dataset_id));
  
  // Fetch feature importance
  const fiAsync = useAsync(() => 
    targetColumn ? edaAPI.computeFeatureImportance(dataset_id, targetColumn) : Promise.resolve([])
  );

  // Initialize - Load EDA data on mount
  useEffect(() => {
    if (dataset_id) {
      edaAsync.execute();
    }
  }, [dataset_id]);

  // Load target column from storage
  useEffect(() => {
    const storedTarget = storageUtils.getTargetColumn(dataset_id);
    if (storedTarget) {
      setTargetColumn(storedTarget);
    }
  }, [dataset_id]);

  // Auto-compute feature importance when target column changes
  useEffect(() => {
    if (targetColumn) {
      fiAsync.execute();
    }
  }, [targetColumn]);
  
  const data = edaAsync.data?.data || edaAsync.data;
  
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

  // Handle target column change
  const handleTargetChange = useCallback((column) => {
    setTargetColumn(column);
    storageUtils.setTargetColumn(dataset_id, column);
  }, [dataset_id]);

  // Loading states
  if (edaAsync.isLoading) {
    return <div className="p-6">Loading insights...</div>;
  }

  if (edaAsync.isError) {
    return <div className="p-6 text-red-600">Error loading insights: {edaAsync.error}</div>;
  }

  
  
  if (!data) {
    return <div className="p-6">No data available</div>;
  }

  // Extract feature importance data
  const featureImportanceData = fiAsync.data?.data || fiAsync.data || [];

  const explainInsights = interpretFeatureImportance(featureImportanceData);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Data Insights Dashboard</h1>
          <p className="text-gray-600">Analyze dataset structure, quality, and model readiness</p>
        </div>

        {/* Overview Section */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <OverviewCards overview={data.overview} />
        </div>

        {/* Missing Values Section */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <MissingValuesChart data={data.missing} />
        </div>

        {/* Numerical Analysis Section */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <NumericalAnalysis data={data.numerical} />
        </div>

        {/* Categorical Analysis Section */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <CategoricalAnalysis data={data.categorical} />
        </div>

        {/* Correlation Heatmap Section */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <CorrelationHeatmap data={data.correlation} />
        </div>

        {/* Insights Section */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <InsightPanel insights={insights} />
        </div>

        {/* Recommendations Section */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <RecommendationPanel recommendations={recommendations} />
        </div>

        {/* Target Insights Section */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <TargetInsights targetInfo={targetInfo} targetColumn={targetColumn} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
        <ModelRecommendations models={modelRecs} />
        </div>

        {/* Feature Importance Section */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">⭐ Feature Importance</h2>

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

          <ExplainabilityPanel insights={explainInsights} />
        </div>
      </div>
    </div>
  );
}

export default DataInsights;