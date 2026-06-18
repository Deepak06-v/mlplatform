import { TrendingUp } from 'lucide-react';

/**
 * Advanced Performance Metrics Display
 * Shows comprehensive metrics for model evaluation
 */

function PerformanceMetrics({ leaderboard, problemType }) {
  if (!leaderboard || leaderboard.length === 0) {
    return <div className="p-6 text-gray-500 text-center">No models to display</div>;
  }

  const getMetricValue = (metrics, key, defaultValue = 'N/A') => {
    if (!metrics || typeof metrics !== 'object') return defaultValue;
    return metrics[key] ?? defaultValue;
  };

  const getMetricColor = (value) => {
    if (typeof value !== 'number') return 'text-gray-600';
    if (value >= 0.8) return 'text-green-600';
    if (value >= 0.6) return 'text-blue-600';
    if (value >= 0.4) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const isClassification = problemType === 'classification';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Performance Metrics</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Model</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">
                {isClassification ? 'Accuracy' : 'R² Score'}
              </th>
              {isClassification && (
                <>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Precision</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Recall</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">F1 Score</th>
                </>
              )}
              {!isClassification && (
                <th className="px-4 py-3 text-center font-semibold text-gray-900">RMSE</th>
              )}
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Stability (Std)</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item, idx) => {
              const primaryMetric = isClassification 
                ? getMetricValue(item.metrics, 'accuracy', item.score)
                : getMetricValue(item.metrics, 'r2', item.score);
              
              return (
                <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.model}</td>
                  
                  <td className={`px-4 py-3 text-center font-bold ${getMetricColor(primaryMetric)}`}>
                    {typeof primaryMetric === 'number' ? (primaryMetric * 100).toFixed(2) : primaryMetric}
                    {typeof primaryMetric === 'number' ? '%' : ''}
                  </td>

                  {isClassification && (
                    <>
                      <td className={`px-4 py-3 text-center font-semibold ${getMetricColor(getMetricValue(item.metrics, 'precision'))}`}>
                        {typeof getMetricValue(item.metrics, 'precision') === 'number' 
                          ? (getMetricValue(item.metrics, 'precision') * 100).toFixed(2) + '%'
                          : 'N/A'}
                      </td>

                      <td className={`px-4 py-3 text-center font-semibold ${getMetricColor(getMetricValue(item.metrics, 'recall'))}`}>
                        {typeof getMetricValue(item.metrics, 'recall') === 'number'
                          ? (getMetricValue(item.metrics, 'recall') * 100).toFixed(2) + '%'
                          : 'N/A'}
                      </td>

                      <td className={`px-4 py-3 text-center font-semibold ${getMetricColor(getMetricValue(item.metrics, 'f1'))}`}>
                        {typeof getMetricValue(item.metrics, 'f1') === 'number'
                          ? (getMetricValue(item.metrics, 'f1') * 100).toFixed(2) + '%'
                          : 'N/A'}
                      </td>
                    </>
                  )}

                  {!isClassification && (
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">
                      {typeof getMetricValue(item.metrics, 'rmse') === 'number'
                        ? getMetricValue(item.metrics, 'rmse').toFixed(4)
                        : 'N/A'}
                    </td>
                  )}

                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-gray-700 font-semibold">{(item.std * 100).toFixed(2)}%</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${
                            item.std < 0.05 ? 'bg-green-500' :
                            item.std < 0.1 ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(item.std * 200, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">Metric Interpretation:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
          <div>• <strong>Accuracy</strong>: Overall correctness</div>
          <div>• <strong>Precision</strong>: Positive prediction accuracy</div>
          <div>• <strong>Recall</strong>: True positive detection rate</div>
          <div>• <strong>F1</strong>: Precision-Recall balance</div>
          <div>• <strong>Stability</strong>: Lower = more consistent across folds</div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceMetrics;
