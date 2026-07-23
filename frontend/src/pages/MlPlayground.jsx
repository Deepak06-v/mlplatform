import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";

import ModelControls from "../components/MlPlayground/ModelControl";
import MetricsCards from "../components/MlPlayground/MetricsCards";
import ModelInsightsPanel from "../components/MlPlayground/ModelInsightsPanel";

import { edaAPI } from "../../services/api";
import { storageUtils } from "../utils/storageUtils";
import { useAsync } from "../hooks/useAsync";
import { generateModelInsights } from "../utils/modelInsights";
import { useAiRecommendation } from "../hooks/useAiRecommendation";
import { useNotification } from "../contexts/NotificationContext";
import { useSession } from "../contexts/SessionContext";

function MlPlayground() {
  const { dataset_id } = useParams();
  const { notify } = useNotification();
  const { session, updateSession } = useSession();
  const sessionSynced = useRef(false);

  // =============================
  // Restore playground config from storage (survives navigation)
  // =============================
  const storedPlayground = dataset_id ? storageUtils.getPlaygroundConfig(dataset_id) : {};

  const targetColumn = session?.target_column || "";
  const [problemType, setProblemType] = useState("");
  const [algorithm, setAlgorithm] = useState(storedPlayground.algorithm);
  const [modelInsights, setModelInsights] = useState([]);
  const [params, setParams] = useState(storedPlayground.params);
  const [aiEnabled, setAiEnabled] = useState(false);
  const trainingFromCache = useRef(false);

  const mlConfig = storageUtils.getMLConfig(dataset_id);
  const preprocessConfig = mlConfig?.preprocess_config || {};

  // Sync session from backend on mount — restores problem type, algorithm, etc.
  useEffect(() => {
    if (!dataset_id || sessionSynced.current) return;
    sessionSynced.current = true;

    storageUtils.syncDatasetSession(dataset_id).then(() => {
      const updated = storageUtils.getMLConfig(dataset_id);
      if (updated.problem_type && !problemType) setProblemType(updated.problem_type);
      const pg = storageUtils.getPlaygroundConfig(dataset_id);
      if (pg.algorithm && !algorithm) setAlgorithm(pg.algorithm);
    });
  }, [dataset_id]);

  // Persist algorithm/params whenever they change
  useEffect(() => {
    if (!dataset_id) return;
    storageUtils.savePlaygroundConfig(dataset_id, { algorithm, params });
  }, [algorithm, params, dataset_id]);

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
  // Detect problem type from target column
  // =============================
  useEffect(() => {
    if (!targetColumn) {
      setProblemType("");
      return;
    }

    const columnTypes = storageUtils.getColumnTypes() || [];
    const targetColInfo = columnTypes.find(
      (col) => col.column === targetColumn
    );

    const isRegression = targetColInfo?.type === "numerical";
    const newProblemType = isRegression ? "regression" : "classification";

    setProblemType(newProblemType);

    // Only set default algorithm if none was previously stored
    if (!algorithm) {
      const defaultAlgo = isRegression ? "linear" : "rf";
      setAlgorithm(defaultAlgo);
    }

    const updatedConfig = {
      ...mlConfig,
      problem_type: newProblemType
    };

    storageUtils.setMLConfig(dataset_id, updatedConfig);

  }, [targetColumn]);

  // =============================
  // Restore training result from session on mount
  // =============================
  useEffect(() => {
    if (!dataset_id) return;
    const cachedResult = storageUtils.getPlaygroundResult(dataset_id);
    if (cachedResult) {
      trainingFromCache.current = true;
      trainAsync.setData(cachedResult);
    }
  }, [dataset_id]);

  // =============================
  // Handle cache-restored training results (skip save — saving is in handleTrain)
  // =============================
  useEffect(() => {
    if (trainingFromCache.current) {
      trainingFromCache.current = false;
    }
  }, [trainAsync.isSuccess, trainAsync.data, dataset_id]);

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
  // AI settings
  // =============================
  useEffect(() => {
    if (dataset_id) {
      const settings = storageUtils.getAiSettings();
      setAiEnabled(settings.mode === "ai");
    }
  }, [dataset_id]);

  const playgroundAi = useAiRecommendation({
    datasetId: dataset_id,
    page: "playground",
    store: storageUtils,
    enabled: aiEnabled
  });

  // =============================
  // Handlers
  // =============================
  const handleTargetChange = useCallback(
    (column) => {
      updateSession({ target_column: column });
    },
    [updateSession]
  );

  const handleTrain = useCallback(async () => {
    if (trainAsync.isLoading) return;
    notify.info("Training started", `${algorithm} training...`);
    try {
      const result = await trainAsync.execute();
      if (!result || !dataset_id) return;
      storageUtils.addTrainingExperiment(dataset_id, {
        response: result,
        algorithm,
        params,
        preprocessing: preprocessConfig,
        metrics: result?.data?.metrics || {},
        problem_type: problemType,
        target_column: targetColumn
      });
      storageUtils.addActivity(dataset_id, {
        type: "training",
        title: "Model trained",
        description: `${algorithm} model trained`
      });
      notify.success("Training complete", `${algorithm} model trained`);
    } catch (error) {
      console.error("Training failed:", error);
      notify.error("Training failed", error.message || "Unknown error");
    }
  }, [trainAsync, algorithm, dataset_id, params, preprocessConfig, problemType, targetColumn]);

  // =============================
  // Data prep
  // =============================
  const columnTypes = storageUtils.getColumnTypes() || [];
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

          <ModelInsightsPanel
            insights={modelInsights}
            aiData={playgroundAi.aiResult?.data}
            aiStatus={playgroundAi.aiStatus}
          />

        </div>
      </div>
    </div>
  );
}

export default MlPlayground;