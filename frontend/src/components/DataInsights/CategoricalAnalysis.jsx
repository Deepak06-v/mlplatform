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
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        🏷️ Categorical Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((col, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 h-full">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900">{col.column}</h4>
              <p className="text-sm text-gray-600 mt-1">
                Unique values: <span className="font-medium text-gray-900">{col.unique_count}</span>
              </p>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={col.top_categories}
                  dataKey="count"
                  nameKey="value"
                  outerRadius={60}
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
    </div>
  );
}

export default CategoricalAnalysis;