function Leaderboard({ leaderboard, best }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Leaderboard</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Model</th>
            <th>Score</th>
            <th>Std</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
  {leaderboard.map((item, index) => {
    const maxScore = leaderboard[0].score;
    const width = (item.score / maxScore) * 100;

    return (
      <tr key={index} className="border-b">
        <td className="py-3 font-medium">{item.model}</td>

        <td className="w-1/2">
          <div className="bg-gray-200 h-3 rounded">
            <div
              className={`h-3 rounded ${
                item.model === best ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${width}%` }}
            />
          </div>
        </td>

        <td className="text-sm">
  {item.score}

  {/* Params */}
  <div className="text-xs text-gray-500 mt-1">
    {Object.entries(item.params || {})
      .slice(0, 2)
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ")}
  </div>
</td>
        <td>
          {item.model === best && (
            <span className="text-green-600 font-semibold text-sm">
              Best
            </span>
          )}
        </td>
      </tr>
    );
  })}
</tbody>
      </table>
    </div>
  );
}

export default Leaderboard;