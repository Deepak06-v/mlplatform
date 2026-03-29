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
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">
        Missing Values Analysis
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="column" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="missing_percentage" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MissingValuesChart;