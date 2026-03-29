import { useState,useEffect } from "react";
import UploadBox from "../components/UploadDataset/UploadBox";
import MetadataCards from "../components/UploadDataset/MetadatCards";
import DatasetPreview from "../components/UploadDataset/DatasetPreview";
import { analyzeDataset } from "../utils/analyzeDataset";
import { getAdvancedRecommendations } from "../utils/getAdvancedRecommendations";
import Recommendations from "../components/UploadDataset/Recommendations"
import { analyzeColumns } from "../utils/analyzeColumns";
import ColumnAnalysisTable from "../components/UploadDataset/ColumnAnalysis";
import TargetSelector from "../components/UploadDataset/TargetSelector";
import { useNavigate } from "react-router-dom";

function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [target, setTarget] = useState("");
  const [datasetId, setDatasetId] = useState(null);
  const analysis = analyzeDataset(data);
  const columnAnalysis = analyzeColumns(data);
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
const advancedRecommendations = getAdvancedRecommendations(
  columnAnalysis,
  analysis?.rows
);  
useEffect(() => {
  if (file) {
    localStorage.setItem("file_name", file.name);
  }

  if (data) {
    // store only small preview (first 20 rows)
    localStorage.setItem(
      "preview_data",
      JSON.stringify(data.slice(0, 20))
    );
  }
}, [file, data]);
useEffect(() => {
  const savedFileName = localStorage.getItem("file_name");
  const savedPreview = localStorage.getItem("preview_data");

  if (savedFileName) {
    setFile({ name: savedFileName, size: 0 }); // mock file
  }

  if (savedPreview) {
    setData(JSON.parse(savedPreview));
  }
}, []);
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold">Upload Dataset</h1>
      <p className="text-gray-500">
        Upload your dataset to begin analysis
      </p>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <UploadBox
  file={file}
  setFile={setFile}
  setData={setData}
  setError={setError}
  setDatasetId={setDatasetId}
/>

      {file && (
        <div className="mt-4 text-green-600">
          {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}

      <MetadataCards analysis={analysis} />
      <TargetSelector
  columns={columns}
  data={data}
  target={target}
  setTarget={setTarget}
/>
      <Recommendations recommendations={advancedRecommendations} />
      <DatasetPreview data={data} />
      <ColumnAnalysisTable columns={columnAnalysis} />
    
      {datasetId && target && (
  <button
    onClick={() =>
      navigate(`/insights/${datasetId}`)
    }
    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    Proceed to Data Insights →
  </button>
)}
<button
  onClick={() => {
    localStorage.clear();
    setFile(null);
    setData(null);
    setDatasetId(null);
  }}
>
  Reset
</button>

    </div>
    
  );
}

export default UploadPage;