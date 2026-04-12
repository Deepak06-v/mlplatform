import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function FeatureImportanceChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-600 text-sm">No feature importance data available</p>;
  }

  if (!Array.isArray(data)) {
    return <p className="text-red-600 text-sm">Error loading feature importance data</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="feature" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="importance" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FeatureImportanceChart;