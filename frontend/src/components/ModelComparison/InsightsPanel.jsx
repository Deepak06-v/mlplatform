function InsightsPanel({ insights }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Insights</h2>

      <ul className="space-y-3">
        {insights.map((insight, index) => (
          <li className="p-3 bg-blue-50 rounded-lg text-sm border-l-4 border-blue-500">
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InsightsPanel;