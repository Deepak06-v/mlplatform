function Recommendations({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="mt-6 bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-3">
        Smart Recommendations
      </h2>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg text-sm ${
              rec.type === "critical"
                ? "bg-red-50 text-red-700"
                : rec.type === "warning"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {rec.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Recommendations;