import { useParams } from "react-router-dom";

function DataInsights() {
  const { dataset_id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Data Insights</h1>

      <p className="mt-4">
        <strong>Dataset ID:</strong> {dataset_id}
      </p>
    </div>
  );
}

export default DataInsights;