import React from "react";

function CorrelationHeatmap({ data }) {
  if (!data || !data.matrix.length) {
    return <p className="text-gray-500">No correlation data</p>;
  }

  const { columns, matrix } = data;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">
        Correlation Matrix
      </h3>

      <div className="overflow-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `120px repeat(${columns.length}, 80px)`
          }}
        >
          <div></div>

          {columns.map((col) => (
            <div key={col} className="text-xs text-center p-2 font-semibold">
              {col}
            </div>
          ))}

          {matrix.map((row, i) => (
            <React.Fragment key={i}>
              <div className="text-xs font-semibold p-2">
                {columns[i]}
              </div>

              {row.map((val, j) => (
                <div
                  key={j}
                  className="h-10 flex items-center justify-center text-xs rounded"
                  style={{
                    backgroundColor: getColor(val),
                    color: Math.abs(val) > 0.5 ? "white" : "black"
                  }}
                  title={`Correlation: ${val}`}
                >
                  {val}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <span>-1</span>
        <div className="flex-1 h-3 bg-gradient-to-r from-blue-500 via-white to-red-500 rounded"></div>
        <span>+1</span>
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