import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f"];

function CategoricalAnalysis({ data }) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">
        Categorical Analysis
      </h3>

      {data.map((col, idx) => (
        <div key={idx} className="mb-8 p-4 bg-white shadow rounded">
          <h4 className="font-semibold mb-2">{col.column}</h4>

          <p className="text-sm mb-4">
            Unique values: {col.unique_count}
          </p>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={col.top_categories}
                dataKey="count"
                nameKey="value"
                outerRadius={80}
                label
              >
                {col.top_categories.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

export default CategoricalAnalysis;