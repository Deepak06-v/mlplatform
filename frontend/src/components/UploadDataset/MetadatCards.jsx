function MetadataCards({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Rows</p>
        <p className="text-xl font-semibold">{analysis.rows}</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Columns</p>
        <p className="text-xl font-semibold">{analysis.columns}</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Missing</p>
        <p className="text-xl font-semibold">
          {analysis.missing} ({analysis.missingPercentage}%)
        </p>
      </div>
    </div>
  );
}

export default MetadataCards;