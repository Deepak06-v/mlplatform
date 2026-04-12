function OverviewCards({ overview }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Rows</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{overview.rows}</p>
      </div>

      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Columns</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{overview.columns}</p>
      </div>

      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Missing %</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          {overview.missing_percentage}%
        </p>
      </div>

      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Duplicates</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{overview.duplicates}</p>
      </div>

    </div>
  );
}

export default OverviewCards;