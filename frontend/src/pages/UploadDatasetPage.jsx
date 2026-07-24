import { useState, useEffect, useCallback, useRef } from "react";
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
import { useSession } from "../contexts/SessionContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { datasetAPI } from "../../services/api";

function UploadPage() {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { dataset: sessionDataset, datasetId: globalDatasetId, session, updateSession } = useSession();
  const { hasDataset, workspace, loading: workspaceLoading, refetch } = useWorkspace();
  const restored = useRef(false);

  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [datasetId, setDatasetId] = useState(null);
  const [columnTypes, setColumnTypesInState] = useState({});
  const [aiMode, setAiMode] = useState(false);

  const target = session?.target_column || "";

  const handleTargetChange = useCallback((column) => {
    updateSession({ target_column: column });
  }, [updateSession]);

  // Restore full upload state from backend session on mount
  useEffect(() => {
    if (!globalDatasetId || restored.current) return;
    restored.current = true;

    setDatasetId(globalDatasetId);

    const settings = storageUtils.getAiSettings();
    setAiMode(settings.mode === "ai");

    // If session dataset already has preview, use it immediately
    const cachedPreview = storageUtils.getPreviewData();
    const cachedTypes = storageUtils.getColumnTypes();

    if (cachedPreview && cachedPreview.length > 0) {
      setData(cachedPreview);
      if (cachedTypes && cachedTypes.length > 0) {
        const typeMap = {};
        cachedTypes.forEach((t) => { typeMap[t.column] = t.type; });
        setColumnTypesInState(typeMap);
      }
      const cachedFileName = storageUtils.getFileName();
      if (cachedFileName) {
        setFile({ name: cachedFileName });
      }
      return;
    }

    // Otherwise fetch from backend
    datasetAPI.get(globalDatasetId).then((res) => {
      if (!restored.current) return;
      if (!res?.data) return;
      const d = res.data;

      setDatasetId(d.dataset_id);

      const preview = d.preview || [];
      setData(preview);
      storageUtils.setPreviewData(preview);

      const types = d.column_types || [];
      storageUtils.setColumnTypes(types);
      const typeMap = {};
      types.forEach((t) => { typeMap[t.column] = t.type; });
      setColumnTypesInState(typeMap);

      if (d.filename) {
        storageUtils.setFileName(d.filename);
        setFile({ name: d.filename, size: Math.round(d.file_size_mb * 1024 * 1024) });
      }
    }).catch(() => {});
  }, [globalDatasetId]);

  // Refetch workspace when dataset changes
  useEffect(() => {
    if (datasetId) {
      refetch();
    }
  }, [datasetId, refetch]);

  // Persist AI mode
  useEffect(() => {
    storageUtils.saveAiSettings({ mode: aiMode ? "ai" : "static" });
  }, [aiMode, datasetId]);

  const handleProceed = useCallback(() => {
    if (datasetId && target) {
      navigate(`/insights/${datasetId}`);
    }
  }, [datasetId, target, navigate]);

  const analysis = analyzeDataset(data);
  const actualRowCount = sessionDataset?.rows || analysis?.rows || 0;
  const actualColumnCount = sessionDataset?.columns || analysis?.columns || 0;

  const displayAnalysis = data && analysis ? {
    ...analysis,
    rows: Math.max(analysis.rows, actualRowCount),
    columns: Math.max(analysis.columns, actualColumnCount),
  } : analysis;
  const columnAnalysis = analyzeColumns(data);
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  const advancedRecommendations = getAdvancedRecommendations(
    columnAnalysis,
    analysis?.rows
  );

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (hasDataset && !datasetId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto mt-12 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
            <h1 className="text-xl font-bold text-amber-800 mb-2">Dataset Already Exists</h1>
            <p className="text-amber-600 text-sm mb-6">
              Your workspace already contains a dataset. Free accounts are limited to one dataset at a time.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors mr-3"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                const sidebar = document.querySelector('[data-new-experiment]');
                if (sidebar) sidebar.click();
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Start New Experiment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold">Upload Dataset</h1>
      <p className="text-gray-500">Upload your dataset to begin analysis</p>

      {error && <div className="text-red-500 mt-4 p-3 bg-red-50 rounded">{error}</div>}

      {datasetId && !file && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-700 font-medium">
            Active dataset session restored
          </p>
          <p className="text-blue-600 text-sm mt-1">
            Dataset ID: {datasetId}
            {sessionDataset?.filename ? ` — ${sessionDataset.filename}` : ""}
          </p>
        </div>
      )}

      <UploadBox
        file={file}
        setFile={setFile}
        setData={setData}
        setError={setError}
        setDatasetId={setDatasetId}
        setColumnTypes={setColumnTypesInState}
      />

      {file && (
        <div className="mt-4 text-green-600">
          ✓ {file.name}{file.size ? ` (${(file.size / 1024).toFixed(2)} KB)` : ""}
        </div>
      )}

      <MetadataCards analysis={displayAnalysis} />

      <TargetSelector
        columns={columns}
        data={data}
        target={target}
        setTarget={handleTargetChange}
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

      </div>
    </div>
  );
}

export default UploadPage;
