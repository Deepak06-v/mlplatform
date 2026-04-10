function MetricsCards({ results, error, isLoading }) {

  if (isLoading) {
    return <p className="text-blue-600">Training model...</p>;
  }

  if (error) {
    return <div className="bg-red-50 p-4 text-red-600 rounded">{error}</div>;
  }

  // Extract metrics from the response structure
  const metrics = results?.data?.metrics || results?.metrics;

  if (!metrics) return <p className="text-gray-500">No results yet</p>;

  return (
    <div className="grid grid-cols-2 gap-4">

      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="bg-white p-4 shadow rounded">
          <h4 className="text-sm text-gray-500 capitalize">{key.replace("_", " ")}</h4>
          <p className="text-2xl font-bold text-blue-600">{value}</p>
        </div>
      ))}

    </div>
  );
}

export default MetricsCards;