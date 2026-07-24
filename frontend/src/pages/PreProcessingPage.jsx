import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { storageUtils } from "../utils/storageUtils";
import { useNotification } from "../contexts/NotificationContext";
import { useSession } from "../contexts/SessionContext";
import { useWorkspace } from "../contexts/WorkspaceContext";

function PreprocessingPage() {
  const { dataset_id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { session: globalSession } = useSession();
  const { state: wsState, updateSection } = useWorkspace();
  const sessionSynced = useRef(false);

  const [problemType, setProblemType] = useState("");

  const targetColumn = globalSession?.target_column || "";

  const PREPROCESS_DEFAULTS = {
    num_impute: "median",
    cat_impute: "most_frequent",
    scaling: "standard",
    num_transform: "none",
    imbalance: "none",
    target_transform: "none"
  };

  const [config, setConfig] = useState(() => {
    const wsConfig = wsState?.preprocessing;
    if (wsConfig && Object.keys(wsConfig).length > 0) {
      return { ...PREPROCESS_DEFAULTS, ...wsConfig };
    }
    const stored = dataset_id ? storageUtils.getPreprocessConfig(dataset_id) : {};
    return { ...PREPROCESS_DEFAULTS, ...stored };
  });

  useEffect(() => {
    if (!dataset_id || sessionSynced.current) return;
    sessionSynced.current = true;

    storageUtils.syncDatasetSession(dataset_id).then(() => {
      const stored = storageUtils.getPreprocessConfig(dataset_id);
      setConfig({ ...PREPROCESS_DEFAULTS, ...stored });
    });
  }, [dataset_id]);

  useEffect(() => {
    const wsConfig = wsState?.preprocessing;
    if (wsConfig && Object.keys(wsConfig).length > 0) {
      setConfig({ ...PREPROCESS_DEFAULTS, ...wsConfig });
    } else {
      const stored = storageUtils.getPreprocessConfig(dataset_id);
      setConfig({ ...PREPROCESS_DEFAULTS, ...stored });
    }
  }, [dataset_id, wsState?.preprocessing]);

  useEffect(() => {
    if (!targetColumn) {
      setProblemType("");
      return;
    }

    const mlConfig = storageUtils.getMLConfig(dataset_id);
    const storedProblemType = mlConfig?.problem_type;
    if (storedProblemType) {
      setProblemType(storedProblemType);
      return;
    }

    const columnTypes = storageUtils.getColumnTypes() || [];
    const targetInfo = columnTypes.find(
      (col) => col.column.trim().toLowerCase() === targetColumn.trim().toLowerCase()
    );

    if (!targetInfo) return;

    setProblemType(targetInfo.type === "numerical" ? "regression" : "classification");
  }, [targetColumn, dataset_id]);

  const handleChange = (key, value) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      storageUtils.savePreprocessConfig(dataset_id, next);
      updateSection("preprocessing", next);
      return next;
    });
  };

  const handleContinue = () => {
    storageUtils.savePreprocessConfig(dataset_id, config);
    updateSection("preprocessing", config);
    storageUtils.addActivity(dataset_id, {
      type: "preprocess",
      title: "Preprocessing saved",
      description: "Configuration saved"
    });
    notify.success("Configuration saved", "Proceeding to model training");
    navigate(`/playground/${dataset_id}`);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-sm">
      <h1 className="text-xl font-semibold mb-4">
        Preprocessing Configuration
      </h1>

      {!problemType && (
        <p className="text-red-500 mb-4">
          Please select a target column first.
        </p>
      )}

      {problemType && (
        <>
          <p className="mb-4 text-gray-600">
            Problem Type: <b>{problemType}</b>
          </p>

          <div className="mb-4">
            <label className="block mb-1">Numerical Imputation</label>
            <select
              value={config.num_impute}
              onChange={(e) => handleChange("num_impute", e.target.value)}
              className="border p-2 w-full rounded"
            >
              <option value="median">Median</option>
              <option value="mean">Mean</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1">Categorical Imputation</label>
            <select
              value={config.cat_impute}
              onChange={(e) => handleChange("cat_impute", e.target.value)}
              className="border p-2 w-full rounded"
            >
              <option value="most_frequent">Most Frequent</option>
              <option value="constant">Constant</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1">Numerical Transformation</label>
            <select
              value={config.num_transform}
              onChange={(e) => handleChange("num_transform", e.target.value)}
              className="border p-2 w-full rounded"
            >
              <option value="none">None</option>
              <option value="log">Log Transform</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1">Scaling</label>
            <select
              value={config.scaling}
              onChange={(e) => handleChange("scaling", e.target.value)}
              className="border p-2 w-full rounded"
            >
              <option value="standard">StandardScaler</option>
              <option value="none">None</option>
            </select>
          </div>

          {problemType === "classification" ? (
            <div className="mb-4">
              <label className="block mb-1">Imbalance Handling</label>
              <select
                value={config.imbalance}
                onChange={(e) => handleChange("imbalance", e.target.value)}
                className="border p-2 w-full rounded"
              >
                <option value="none">None</option>
                <option value="class_weight">Class Weights</option>
                <option value="smote">SMOTE</option>
              </select>
            </div>
          ) : null}

          {problemType === "regression" ? (
            <div className="mb-4">
              <label className="block mb-1">Target Transformation</label>
              <select
                value={config.target_transform}
                onChange={(e) => handleChange("target_transform", e.target.value)}
                className="border p-2 w-full rounded"
              >
                <option value="none">None</option>
                <option value="log">Log Transform</option>
              </select>
            </div>
          ) : null}

          <button
            onClick={handleContinue}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Continue to Model Training
          </button>
        </>
      )}
    </div>
  );
}

export default PreprocessingPage;
