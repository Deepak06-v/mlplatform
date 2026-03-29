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
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">
        Numerical Analysis
      </h3>

      {data.map((col, index) => {
        const chartData = col.histogram.counts.map((count, i) => ({
          bin: `${col.histogram.bins[i].toFixed(1)} - ${col.histogram.bins[i + 1].toFixed(1)}`,
          value: count,
        }));

        return (
          <div key={index} className="mb-8 p-4 bg-white shadow rounded">
            <h4 className="font-semibold mb-2">{col.column}</h4>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4">
              <p>Mean: {col.mean}</p>
              <p>Median: {col.median}</p>
              <p>Std: {col.std}</p>
              <p>Min: {col.min}</p>
              <p>Max: {col.max}</p>
              <p>Skew: {col.skew}</p>
            </div>

            {/* Histogram */}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="bin" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}

export default NumericalAnalysis;