import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import OverviewCards from "../components/DataInsights/OverviewCards";
import MissingValuesChart from "../components/DataInsights/MissingValuesChart";
import NumericalAnalysis from "../components/DataInsights/NumericalAnalysis";
import CategoricalAnalysis from "../components/DataInsights/CategoricalAnalysis";

function DataInsights() {
  const [edaData, setEdaData] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  let datasetId = queryParams.get("dataset_id");

  // 🔥 fallback from localStorage
  if (!datasetId) {
    datasetId = localStorage.getItem("dataset_id");
  }

  useEffect(() => {
    if (!datasetId) return;

    fetch("http://127.0.0.1:8000/eda/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dataset_id: datasetId }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("EDA response:", data);
        setEdaData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [datasetId]);

  if (loading) return <div>Loading insights...</div>;

  if (!edaData || edaData.error) {
    return <div>Error loading insights</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Data Insights</h2>

      {/* 🔥 Overview Section */}
      <OverviewCards overview={edaData.overview} />
      <MissingValuesChart data={edaData.missing} />
      <NumericalAnalysis data={edaData.numerical} />
      <CategoricalAnalysis data={edaData.categorical} />
    </div>
  );
}

export default DataInsights;