import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import ModelControls from "../components/MlPlayground/ModelControl";
import MetricsCards from "../components/MlPlayground/MetricsCards";
import { edaAPI } from "../../services/api";
import { storageUtils } from "../utils/storageUtils";
import { useAsync } from "../hooks/useAsync";

function MlPlayground() {
  const { dataset_id } = useParams();
  
  const [targetColumn, setTargetColumn] = useState("");
  const [problemType, setProblemType] = useState("");
  const [algorithm, setAlgorithm] = useState("");
  const [params, setParams] = useState({
    max_depth: 5,
    n_estimators: 100
  });

  // Validate dataset_id exists
  if (!dataset_id) {
    return <div className="p-6 text-red-600">Error: No dataset selected</div>;
  }

  // Use Async hook for training
  const trainAsync = useAsync(async () => {
    if (!targetColumn) {
      throw new Error("Please select a target column");
    }
    if (!algorithm) {
      throw new Error("Please select an algorithm");
    }
    return edaAPI.trainModel(dataset_id, targetColumn, algorithm, params);
  });

  // Initialize target column from storage
  useEffect(() => {
    const storedTarget = storageUtils.getTargetColumn(dataset_id);
    if (storedTarget) {
      setTargetColumn(storedTarget);
    }
  }, [dataset_id]);

  // Auto-detect problem type based on target column type
  useEffect(() => {
    if (!targetColumn) {
      setProblemType("");
      setAlgorithm("");
      return;
    }

    const columnTypes = storageUtils.getColumnTypes();
    const targetColInfo = columnTypes.find(col => col.column === targetColumn);
    
    // Detect based on actual column type
    const isRegression = targetColInfo?.type === "numerical";

    if (isRegression) {
      setProblemType("regression");
      setAlgorithm("linear");
    } else {
      setProblemType("classification");
      setAlgorithm("rf");
    }
  }, [targetColumn]);

  // Save target column to storage
  const handleTargetChange = useCallback((column) => {
    setTargetColumn(column);
    storageUtils.setTargetColumn(dataset_id, column);
  }, [dataset_id]);

  // Handle model training
  const handleTrain = useCallback(async () => {
    try {
      await trainAsync.execute();
    } catch (error) {
      console.error("Training failed:", error);
    }
  }, [trainAsync]);

  const columnTypes = storageUtils.getColumnTypes();
  const columnNames = columnTypes.map(col => col.column);

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
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

      <MetricsCards 
        results={trainAsync.data} 
        error={trainAsync.error}
        isLoading={trainAsync.isLoading}
      />
    </div>
  );
}

export default MlPlayground;