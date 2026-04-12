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

  // ❗ Always keep hooks at top — no early return before this

  const trainAsync = useAsync(async () => {
    if (!targetColumn) {
      throw new Error("Please select a target column");
    }
    if (!algorithm) {
      throw new Error("Please select an algorithm");
    }

    return edaAPI.trainModel(dataset_id, targetColumn, algorithm, params);
  });

  // =============================
  // Load target column
  // =============================
  useEffect(() => {
    const storedTarget = storageUtils.getTargetColumn(dataset_id);
    if (storedTarget) {
      setTargetColumn(storedTarget);
    }
  }, [dataset_id]);

  // =============================
  // Detect problem type
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

    if (isRegression) {
      setProblemType("regression");
      setAlgorithm("linear");
    } else {
      setProblemType("classification");
      setAlgorithm("rf");
    }
  }, [targetColumn]);

  // =============================
  // Generate model insights (KEY FIX)
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
      storageUtils.setTargetColumn(dataset_id, column);
    },
    [dataset_id]
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
  // Early validation (AFTER hooks)
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