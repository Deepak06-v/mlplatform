import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { storageUtils } from "../utils/storageUtils";

function PreprocessingPage() {
  const { dataset_id } = useParams();
  const navigate = useNavigate();

  const [problemType, setProblemType] = useState("");
  const [targetColumn, setTargetColumn] = useState("");

  const [config, setConfig] = useState({
    num_impute: "median",
    cat_impute: "most_frequent",
    scaling: "standard",
    num_transform: "none",
    imbalance: "none",
    target_transform: "none"
  });

  // =============================
  // Detect target + problem type
  // =============================
  useEffect(() => {
    const mlConfig = storageUtils.getMLConfig(dataset_id);
    const target = mlConfig?.target_column;

    const columnTypes = storageUtils.getColumnTypes();

    if (!target || !columnTypes?.length) return;

    setTargetColumn(target);

    // 🔥 FIX: case-insensitive matching
    const targetInfo = columnTypes.find(
      (col) =>
        col.column.trim().toLowerCase() === target.trim().toLowerCase()
    );

    if (!targetInfo) {
      console.warn("Target column not found in columnTypes");
      return;
    }

    if (targetInfo.type === "numerical") {
      setProblemType("regression");
    } else {
      setProblemType("classification");
    }
  }, [dataset_id]);

  // =============================
  // Handle change
  // =============================
  const handleChange = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // =============================
  // Save & Continue
  // =============================
  const handleContinue = () => {
    storageUtils.setMLConfig(dataset_id, {
      target_column: targetColumn,
      preprocess_config: config
    });

    navigate(`/playground/${dataset_id}`);
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-sm">
      <h1 className="text-xl font-semibold mb-4">
        Preprocessing Configuration
      </h1>

      {/* Safety message */}
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

          {/* Numerical Imputation */}
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

          {/* Categorical Imputation */}
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

          {/* Numerical Transformation */}
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

          {/* Scaling */}
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

          {/* Classification ONLY */}
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

          {/* Regression ONLY */}
          {problemType === "regression" ? (
            <div className="mb-4">
              <label className="block mb-1">Target Transformation</label>
              <select
                value={config.target_transform}
                onChange={(e) =>
                  handleChange("target_transform", e.target.value)
                }
                className="border p-2 w-full rounded"
              >
                <option value="none">None</option>
                <option value="log">Log Transform</option>
              </select>
            </div>
          ) : null}

          {/* Continue */}
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