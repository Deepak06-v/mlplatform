import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import OverviewCards from "../components/DataInsights/OverviewCards";
import MissingValuesChart from "../components/DataInsights/MissingValuesChart";
import NumericalAnalysis from "../components/DataInsights/NumericalAnalysis";
import CategoricalAnalysis from "../components/DataInsights/CategoricalAnalysis";
import CorrelationHeatmap from "../components/DataInsights/CorrelationHeatmap";
import FeatureImportance from "../components/DataInsights/FeatureImportance";

import { edaAPI } from "../../services/api";
import { storageUtils } from "../utils/storageUtils";
import { useAsync } from "../hooks/useAsync";

function DataInsights() {
  const { dataset_id } = useParams();
  
  const [edaData, setEdaData] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");

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

  const data = edaAsync.data?.data || edaAsync.data;
  
  if (!data) {
    return <div className="p-6">No data available</div>;
  }

  // Extract feature importance data
  const featureImportanceData = fiAsync.data?.data || fiAsync.data || [];

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Data Insights</h2>

      <OverviewCards overview={data.overview} />
      <MissingValuesChart data={data.missing} />
      <NumericalAnalysis data={data.numerical} />
      <CategoricalAnalysis data={data.categorical} />
      <CorrelationHeatmap data={data.correlation} />

      {/* Feature Importance Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Feature Importance</h2>

        <div className="flex gap-2 mb-4">
          <select
            value={targetColumn}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="border p-2 rounded"
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
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {fiAsync.isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {fiAsync.isLoading ? (
          <p>Computing feature importance...</p>
        ) : fiAsync.isError ? (
          <p className="text-red-600">Error: {fiAsync.error}</p>
        ) : (
          <FeatureImportance data={featureImportanceData} />
        )}
      </div>
    </div>
  );
}

export default DataInsights;