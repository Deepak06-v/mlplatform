import { useEffect, useState } from "react";
import { storageUtils } from "../utils/storageUtils";
import { edaAPI } from "../../services/api";

import Leaderboard from "../components/ModelComparison/Leaderboard";
import InsightsPanel from "../components/ModelComparison/InsightsPanel";
import TopModelCard from "../components/ModelComparison/TopModelCard";

function ModelComparison() {
  const datasetId = storageUtils.getDatasetId();
  const mlConfig = storageUtils.getMLConfig(datasetId);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchComparison = async () => {
    try {
      setLoading(true);

      const response = await edaAPI.compareModels(
        datasetId,
        mlConfig.target_column,
        mlConfig.problem_type,
        mlConfig.preprocess_config
      );

      setData(response.data);
    } catch (err) {
      console.error("Comparison failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  if (!datasetId) {
    return <div className="p-6 text-red-600">No dataset selected</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold">Model Comparison</h1>

        {loading && <div>Loading...</div>}

        {data && (
  <div className="space-y-6">

    {/* TOP MODEL */}
    <TopModelCard 
  bestModel={data.best_model} 
  leaderboard={data.leaderboard}
  recommendation={data.recommendation}
/>

    <div className="grid grid-cols-3 gap-6">

      {/* Leaderboard */}
      <div className="col-span-2 bg-white p-5 rounded-xl shadow-sm">
        <Leaderboard 
          leaderboard={data.leaderboard} 
          best={data.best_model} 
        />
      </div>

      {/* Insights */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <InsightsPanel insights={data.insights} />
      </div>

    </div>

  </div>
)}
      </div>
    </div>
  );
}

export default ModelComparison;