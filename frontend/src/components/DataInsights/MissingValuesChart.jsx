import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function MissingValuesChart({ data }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        📋 Missing Values Analysis
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="column" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="missing_percentage" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MissingValuesChart;