import { useEffect, useState } from "react";

function TargetSelector({ columns, data, target, setTarget }) {
  const [suggested, setSuggested] = useState(null);

 useEffect(() => {
  if (!columns || columns.length === 0 || target) return;

  const best = columns.find((col) => {
    const values = data.map((row) => row[col]);
    const unique = new Set(values).size;

    return unique > 1 && unique <= 10;
  });

  if (best) {
    setSuggested(best);
    setTarget(best);
  }
}, [columns, data, target]);
  return (
    <div className="mt-6 bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-3">
        Select Target Variable
      </h2>

      <select
        value={target || ""}
        onChange={(e) => setTarget(e.target.value)}
        className="w-full p-2 border rounded-lg"
      >
        <option value="">Select target column</option>

        {columns.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>

      {suggested && (
        <p className="text-sm text-gray-500 mt-2">
          Suggested: <span className="font-medium">{suggested}</span>
        </p>
      )}
    </div>
  );
}

export default TargetSelector;