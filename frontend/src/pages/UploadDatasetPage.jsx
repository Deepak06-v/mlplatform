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
import { useNotification } from "../contexts/NotificationContext";

function UploadPage() {
  const navigate = useNavigate();
  const { notify } = useNotification();
  
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [target, setTarget] = useState("");
  const [datasetId, setDatasetId] = useState(null);
  const [columnTypes, setColumnTypes] = useState({});
  const [aiMode, setAiMode] = useState(false);

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

    const savedTarget = storageUtils.getTargetColumn();
    if (savedTarget) {
      setTarget(savedTarget);
    }
  }, []);

  // Restore AI mode from session storage
  useEffect(() => {
    if (datasetId) {
      const settings = storageUtils.getAiSettings(datasetId);
      setAiMode(settings.mode === "ai");
    }
  }, [datasetId]);

  // Persist AI mode when it changes
  useEffect(() => {
    if (datasetId) {
      storageUtils.saveAiSettings(datasetId, { mode: aiMode ? "ai" : "static" });
    }
  }, [aiMode, datasetId]);

  // Persist file and data preview when they change
  useEffect(() => {
    if (file) {
      storageUtils.setFileName(file.name);
    }
    if (data) {
      storageUtils.setPreviewData(data.slice(0, 20));
    }
  }, [file, data]);

  // Persist target selection
  useEffect(() => {
    if (target && datasetId) {
      storageUtils.setTargetColumn(datasetId, target);
    }
  }, [target, datasetId]);

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

      {datasetId && (
        <div className="mt-4 bg-white p-3 rounded-xl shadow flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Recommendation Mode</span>
          <button
            onClick={() => setAiMode((prev) => !prev)}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
              aiMode ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                aiMode ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm text-gray-500">
            {aiMode ? "AI" : "Static"}
          </span>
        </div>
      )}

      <Recommendations
        recommendations={advancedRecommendations}
        datasetId={datasetId}
        store={storageUtils}
        aiEnabled={aiMode}
      />

      <DatasetPreview data={data} />

      <ColumnAnalysisTable columns={columnAnalysis} columnTypes={columnTypes} />

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleProceed}
          disabled={!datasetId || !target}
          className={`px-4 py-2 rounded-lg transition ${
            datasetId && target
              ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          title={!datasetId ? "Upload a dataset first" : !target ? "Select a target column" : ""}
        >
          Proceed to Data Insights →
        </button>

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