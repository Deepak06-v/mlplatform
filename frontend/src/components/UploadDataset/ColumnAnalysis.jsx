function ColumnAnalysisTable({ columns, columnTypes }) {
  if (!columns || columns.length === 0) return null;

  return (
    <div className="mt-6 bg-white p-4 rounded-xl shadow overflow-x-auto">
      <h2 className="text-lg font-semibold mb-3">Column Analysis</h2>

      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 border-b text-left">Column</th>
            <th className="p-2 border-b text-left">Type</th>
            <th className="p-2 border-b text-left">Missing %</th>
            <th className="p-2 border-b text-left">Unique Values</th>
          </tr>
        </thead>

        <tbody>
          {columns.map((col, index) => {
            const key = col.name?.trim().toLowerCase();
            const type = columnTypes?.[key];

            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-2 border-b font-medium">{col.name}</td>

                <td className="p-2 border-b">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      type === "numerical"
                        ? "bg-green-100 text-green-700"
                        : type === "categorical"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {type || "unknown"}
                  </span>
                </td>

                <td className="p-2 border-b">
                  <span
                    className={`${
                      parseFloat(col.missingPercent) > 40
                        ? "text-red-600"
                        : parseFloat(col.missingPercent) > 10
                        ? "text-yellow-600"
                        : "text-gray-700"
                    }`}
                  >
                    {col.missingPercent}%
                  </span>
                </td>

                <td className="p-2 border-b">{col.uniqueValues}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


export default ColumnAnalysisTable;