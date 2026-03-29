function DatasetPreview({ data }) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  return (
    <div className="mt-6 bg-white p-4 rounded-xl shadow overflow-x-auto">
      <h2 className="text-lg font-semibold mb-3">Dataset Preview</h2>

      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} className="p-2 border-b text-left">
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.slice(0, 5).map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col} className="p-2 border-b truncate max-w-37.5">
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DatasetPreview;