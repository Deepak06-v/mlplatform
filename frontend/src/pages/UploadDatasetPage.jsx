import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import UploadBox from "../components/UploadDataset/UploadBox";
import MetadataCards from "../components/UploadDataset/MetadatCards";
import DatasetPreview from "../components/UploadDataset/DatasetPreview";
import Recommendations from "../components/UploadDataset/Recommendations";
import ColumnAnalysisTable from "../components/UploadDataset/ColumnAnalysis";
import TargetSelector from "../components/UploadDataset/TargetSelector";

import { analyzeDataset } from "../utils/analyzeDataset";
import { getAdvancedRecommendations } from "../utils/getAdvancedRecommendations";
import { analyzeColumns } from "../utils/analyzeColumns";
import { storageUtils } from "../utils/storageUtils";

function UploadPage() {
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [target, setTarget] = useState("");
  const [datasetId, setDatasetId] = useState(null);
  const [columnTypes, setColumnTypes] = useState({});

  // Restore from storage on mount
  useEffect(() => {
    const stored = storageUtils.getColumnTypes();
    if (stored && Array.isArray(stored)) {
      const map = {};
      stored.forEach((col) => {
        map[col.column.trim().toLowerCase()] = col.type;
      });
      setColumnTypes(map);
    }

    const savedFileName = storageUtils.getFileName();
    const savedPreview = storageUtils.getPreviewData();
    const savedDatasetId = storageUtils.getDatasetId();

    if (savedFileName) {
      setFile({ name: savedFileName, size: 0 });
    }
    if (savedPreview && Array.isArray(savedPreview)) {
      setData(savedPreview);
    }
    if (savedDatasetId) {
      setDatasetId(savedDatasetId);
    }
  }, []);

  // Persist file and data preview when they change
  useEffect(() => {
    if (file) {
      storageUtils.setFileName(file.name);
    }
    if (data) {
      storageUtils.setPreviewData(data.slice(0, 20));
    }
  }, [file, data]);

  // Handlers
  const handleReset = useCallback(() => {
    storageUtils.clearDataset();
    setFile(null);
    setData(null);
    setDatasetId(null);
    setError("");
    setTarget("");
  }, []);

  const handleProceed = useCallback(() => {
    if (datasetId && target) {
      navigate(`/insights/${datasetId}`);
    }
  }, [datasetId, target, navigate]);

  // Compute analysis
  const analysis = analyzeDataset(data);
  const columnAnalysis = analyzeColumns(data);
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  const advancedRecommendations = getAdvancedRecommendations(
    columnAnalysis,
    analysis?.rows
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold">Upload Dataset</h1>
      <p className="text-gray-500">Upload your dataset to begin analysis</p>

      {error && <div className="text-red-500 mt-4 p-3 bg-red-50 rounded">{error}</div>}

      <UploadBox
        file={file}
        setFile={setFile}
        setData={setData}
        setError={setError}
        setDatasetId={setDatasetId}
        setColumnTypes={setColumnTypes}
      />

      {file && (
        <div className="mt-4 text-green-600">
          ✓ {file.name} ({(file.size / 1024).toFixed(2)} KB)
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

      <ColumnAnalysisTable columns={columnAnalysis} columnTypes={columnTypes} />

      <div className="mt-6 flex gap-4">
        {datasetId && target && (
          <button
            onClick={handleProceed}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Proceed to Data Insights →
          </button>
        )}

        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default UploadPage;