import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import ModelControls from "../components/MlPlayground/ModelControl";
import MetricsCards from "../components/MlPlayground/MetricsCards";
import ModelInsightsPanel from "../components/MlPlayground/ModelInsightsPanel";

import { edaAPI } from "../../services/api";
import { storageUtils } from "../utils/storageUtils";
import { useAsync } from "../hooks/useAsync";
import { generateModelInsights } from "../utils/modelInsights";

function MlPlayground() {
  const { dataset_id } = useParams();

  const [targetColumn, setTargetColumn] = useState("");
  const [problemType, setProblemType] = useState("");
  const [algorithm, setAlgorithm] = useState("");
  const [modelInsights, setModelInsights] = useState([]);
  const [params, setParams] = useState({
    max_depth: 5,
    n_estimators: 100
  });

  // ✅ GET CONFIG FROM STORAGE
  const mlConfig = storageUtils.getMLConfig(dataset_id);
  const preprocessConfig = mlConfig?.preprocess_config || {};

  // =============================
  // Training API
  // =============================
  const trainAsync = useAsync(async () => {
    if (!targetColumn) {
      throw new Error("Please select a target column");
    }
    if (!algorithm) {
      throw new Error("Please select an algorithm");
    }

    return edaAPI.trainModel(
      dataset_id,
      targetColumn,
      algorithm,
      params,
      preprocessConfig
    );
  });

  // =============================
  // Load target column
  // =============================
  useEffect(() => {
    const storedTarget = mlConfig?.target_column;
    if (storedTarget) {
      setTargetColumn(storedTarget);
    }
  }, [dataset_id]);

  // =============================
  // Detect problem type (FIXED ✅)
  // =============================
  useEffect(() => {
    if (!targetColumn) {
      setProblemType("");
      setAlgorithm("");
      return;
    }

    const columnTypes = storageUtils.getColumnTypes();
    const targetColInfo = columnTypes.find(
      (col) => col.column === targetColumn
    );

    const isRegression = targetColInfo?.type === "numerical";

    let newProblemType = "";
    let newAlgorithm = "";

    if (isRegression) {
      newProblemType = "regression";
      newAlgorithm = "linear";
    } else {
      newProblemType = "classification";
      newAlgorithm = "rf";
    }

    setProblemType(newProblemType);
    setAlgorithm(newAlgorithm);

    // ✅ Save to localStorage
    const updatedConfig = {
      ...mlConfig,
      problem_type: newProblemType
    };

    storageUtils.setMLConfig(dataset_id, updatedConfig);

  }, [targetColumn]);

  // =============================
  // Generate model insights
  // =============================
  useEffect(() => {
    if (trainAsync.data?.data?.metrics && problemType) {
      const metrics = trainAsync.data.data.metrics;
      const insights = generateModelInsights(metrics, problemType);
      setModelInsights(insights);
    }
  }, [trainAsync.data, problemType]);

  // =============================
  // Handlers
  // =============================
  const handleTargetChange = useCallback(
    (column) => {
      setTargetColumn(column);

      const updatedConfig = {
        ...mlConfig,
        target_column: column
      };

      storageUtils.setMLConfig(dataset_id, updatedConfig);
    },
    [dataset_id, mlConfig]
  );

  const handleTrain = useCallback(async () => {
    try {
      await trainAsync.execute();
    } catch (error) {
      console.error("Training failed:", error);
    }
  }, [trainAsync]);

  // =============================
  // Data prep
  // =============================
  const columnTypes = storageUtils.getColumnTypes();
  const columnNames = columnTypes.map((col) => col.column);

  // =============================
  // Validation
  // =============================
  if (!dataset_id) {
    return (
      <div className="p-6 text-red-600">
        Error: No dataset selected
      </div>
    );
  }

  // =============================
  // UI
  // =============================
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-6">

        {/* LEFT SIDE */}
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <ModelControls
            columnNames={columnNames}
            targetColumn={targetColumn}
            onTargetChange={handleTargetChange}
            problemType={problemType}
            algorithm={algorithm}
            setAlgorithm={setAlgorithm}
            params={params}
            setParams={setParams}
            onTrain={handleTrain}
            isTraining={trainAsync.isLoading}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          <div className="bg-white p-5 rounded-xl shadow-sm">
            <MetricsCards
              results={trainAsync.data}
              error={trainAsync.error}
              isLoading={trainAsync.isLoading}
            />
          </div>

          <ModelInsightsPanel insights={modelInsights} />

        </div>
      </div>
    </div>
  );
}

export default MlPlayground;