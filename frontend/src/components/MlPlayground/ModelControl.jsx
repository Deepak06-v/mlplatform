function ModelControls({ columnNames = [], targetColumn, onTargetChange, problemType, algorithm, setAlgorithm, params, setParams, onTrain, isTraining }) {

  const models = {
    classification: [
      { label: "Logistic Regression", value: "logistic" },
      { label: "Decision Tree", value: "tree" },
      { label: "Random Forest", value: "rf" }
    ],
    regression: [
      { label: "Linear Regression", value: "linear" },
      { label: "Decision Tree Regressor", value: "tree_reg" },
      { label: "Random Forest Regressor", value: "rf_reg" }
    ]
  };

  return (
    <div className="bg-white p-4 rounded shadow">

      <h3 className="text-lg font-semibold mb-4">Model Controls</h3>

      {/* Target Column Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Target Column</label>
        <select
          value={targetColumn}
          onChange={(e) => onTargetChange(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="">-- Select target column --</option>
          {columnNames.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      {/* Algorithm Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Algorithm</label>
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="">-- Select algorithm --</option>
          {models[problemType]?.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Max Depth */}
      {(algorithm.includes("tree") || algorithm.includes("rf")) && (
        <div>
          <label>Max Depth: {params.max_depth}</label>
          <input
            type="range"
            min="1"
            max="20"
            value={params.max_depth}
            onChange={(e) =>
              setParams({ ...params, max_depth: Number(e.target.value) })
            }
          />
        </div>
      )}

      {/* Estimators */}
      {algorithm.includes("rf") && (
        <div>
          <label>Estimators: {params.n_estimators}</label>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={params.n_estimators}
            onChange={(e) =>
              setParams({ ...params, n_estimators: Number(e.target.value) })
            }
          />
        </div>
      )}

      <button
        onClick={onTrain}
        disabled={!targetColumn || !algorithm || isTraining}
        className="bg-blue-600 text-white px-4 py-2 mt-4 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
      >
        {isTraining ? "Training..." : "Train Model"}
      </button>

    </div>
  );
}

export default ModelControls;