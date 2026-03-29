function OverviewCards({ overview }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      <div className="p-4 bg-white shadow rounded">
        <p className="text-gray-500 text-sm">Rows</p>
        <p className="text-xl font-bold">{overview.rows}</p>
      </div>

      <div className="p-4 bg-white shadow rounded">
        <p className="text-gray-500 text-sm">Columns</p>
        <p className="text-xl font-bold">{overview.columns}</p>
      </div>

      <div className="p-4 bg-white shadow rounded">
        <p className="text-gray-500 text-sm">Missing %</p>
        <p className="text-xl font-bold">
          {overview.missing_percentage}%
        </p>
      </div>

      <div className="p-4 bg-white shadow rounded">
        <p className="text-gray-500 text-sm">Duplicates</p>
        <p className="text-xl font-bold">{overview.duplicates}</p>
      </div>

    </div>
  );
}

export default OverviewCards;