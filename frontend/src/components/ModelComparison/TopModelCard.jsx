function TopModelCard({ bestModel, leaderboard, recommendation }) {
  const best = leaderboard.find(m => m.model === bestModel);

  if (!best) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold mb-2">🏆 Top Model</h2>

      <div className="text-2xl font-bold">{best.model}</div>

      <div className="mt-2 text-sm">
        Score: {best.score}
      </div>

      {/* ✅ NEW */}
      {recommendation && (
        <div className="mt-3 text-sm opacity-90">
          {recommendation.reason}
        </div>
      )}

      {/* Confidence */}
      {recommendation && (
        <div className="mt-2 text-xs opacity-80">
          Confidence: {recommendation.confidence}
        </div>
      )}
    </div>
  );
}

export default TopModelCard