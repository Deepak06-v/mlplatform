import React from "react";

function CorrelationHeatmap({ data }) {
  if (!data || !data.matrix.length) {
    return <p className="text-gray-500">No correlation data</p>;
  }

  const { columns, matrix } = data;

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        🔗 Correlation Matrix
      </h3>

      <div className="overflow-x-auto">
        <div
          className="grid bg-gray-50 rounded-lg border border-gray-200"
          style={{
            gridTemplateColumns: `120px repeat(${columns.length}, 80px)`
          }}
        >
          <div className="p-2"></div>

          {columns.map((col) => (
            <div key={col} className="text-xs text-center p-2 font-semibold text-gray-900 bg-gray-100">
              {col}
            </div>
          ))}

          {matrix.map((row, i) => (
            <React.Fragment key={i}>
              <div className="text-xs font-semibold p-2 bg-gray-100 text-gray-900">
                {columns[i]}
              </div>

              {row.map((val, j) => (
                <div
                  key={j}
                  className="h-10 flex items-center justify-center text-xs font-medium rounded transition duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: getColor(val),
                    color: Math.abs(val) > 0.5 ? "white" : "black"
                  }}
                  title={`Correlation: ${val}`}
                >
                  {val.toFixed(2)}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-6">
        <span className="text-sm font-medium text-gray-600">-1</span>
        <div className="flex-1 h-3 bg-linear-to-r from-blue-500 via-gray-50 to-red-500 rounded"></div>
        <span className="text-sm font-medium text-gray-600">+1</span>
      </div>
    </div>
  );
}

function getColor(value) {
  const red = value > 0 ? 255 : 255 * (1 + value);
  const blue = value < 0 ? 255 : 255 * (1 - value);
  const green = 255 * (1 - Math.abs(value));

  return `rgb(${red}, ${green}, ${blue})`;
}

export default CorrelationHeatmap;