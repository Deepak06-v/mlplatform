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
    return <p>No feature importance data</p>;
  }

  if (!Array.isArray(data)) {
  return <p>Error loading feature importance</p>;
}
  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold mb-4">
        Feature Importance
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="feature" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="importance" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FeatureImportanceChart;