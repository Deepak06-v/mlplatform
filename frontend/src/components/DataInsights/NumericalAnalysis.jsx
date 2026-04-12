import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function NumericalAnalysis({ data }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        🔢 Numerical Analysis
      </h3>

      <div className="space-y-6">
        {data.map((col, index) => {
          const chartData = col.histogram.counts.map((count, i) => ({
            bin: `${col.histogram.bins[i].toFixed(1)} - ${col.histogram.bins[i + 1].toFixed(1)}`,
            value: count,
          }));

          return (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">{col.column}</h4>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm mb-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Mean</p>
                  <p className="text-gray-900 font-medium">{col.mean.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Median</p>
                  <p className="text-gray-900 font-medium">{col.median.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Std Dev</p>
                  <p className="text-gray-900 font-medium">{col.std.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Min</p>
                  <p className="text-gray-900 font-medium">{col.min.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Max</p>
                  <p className="text-gray-900 font-medium">{col.max.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Skew</p>
                  <p className="text-gray-900 font-medium">{col.skew.toFixed(2)}</p>
                </div>
              </div>

              {/* Histogram */}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="bin" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NumericalAnalysis;