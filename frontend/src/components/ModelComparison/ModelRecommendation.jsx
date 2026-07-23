import { Award, AlertCircle, TrendingUp } from 'lucide-react';
import AiBadge from "../common/AiBadge";

function ModelRecommendation({ bestModel, leaderboard, recommendation, problemType, aiResult, aiStatus }) {
  if (!bestModel || !leaderboard) return null;

  const showAi = aiStatus === "loaded" && aiResult?.data != null;
  const aiData = aiResult?.data;

  const best = leaderboard.find(m => m.model === bestModel);
  const second = leaderboard.length > 1 ? leaderboard[1] : null;
  const performanceGap = second ? ((best.score - second.score) * 100).toFixed(2) : 'N/A';

  const getConfidenceBadge = (confidence) => {
    switch(confidence) {
      case 'high':
        return { text: 'High Confidence', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'medium':
        return { text: 'Medium Confidence', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'low':
        return { text: 'Low Confidence', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const confidenceBadge = getConfidenceBadge(recommendation?.confidence || 'medium');

  return (
    <div className={`bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-xl border-2 border-indigo-300 overflow-hidden shadow-lg ${aiStatus === "loading" ? "opacity-60" : ""}`}>
      
      {/* Header with Icon */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6" />
            <h2 className="text-xl font-bold">Recommended Model</h2>
          </div>
          <AiBadge aiStatus={showAi ? "loaded" : aiStatus} />
        </div>
        <p className="text-indigo-100 text-sm">Based on cross-validation analysis</p>
      </div>

      <div className="p-6 space-y-5">
        
        {/* Primary Recommendation */}
        <div className="bg-white rounded-lg p-4 border-2 border-indigo-200">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-3xl font-bold text-indigo-600">{best.model}</div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${confidenceBadge.color}`}>
              {confidenceBadge.text}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-3">
            <div className="text-4xl font-bold text-blue-600">
              {(best.score * 100).toFixed(2)}%
            </div>
            <span className="text-sm text-gray-600">Cross-Validation Score</span>
          </div>

          {second && (
            <div className="text-sm text-gray-700 p-2 bg-blue-50 rounded border border-blue-200">
              <span className="font-semibold text-blue-700">+{performanceGap}%</span> better than {second.model}
            </div>
          )}
        </div>

        {/* AI Summary */}
        {showAi && aiData.summary && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-indigo-900">{aiData.summary}</p>
          </div>
        )}

        {/* Why This Model */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Why This Model?
            </h3>
          </div>

          {showAi && aiData.why_best_model_won ? (
            <ul className="space-y-2">
              {aiData.why_best_model_won.map((reason, i) => (
                <li key={i} className="flex items-start gap-3 p-2 rounded bg-green-50 border border-green-200">
                  <span className="font-bold text-green-600 mt-0.5">✓</span>
                  <span className="text-gray-900 font-medium">{reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {[
                { label: 'Best Validation Performance', value: true },
                { label: 'Stable Cross-Validation', value: best.std < 0.05 },
                { label: 'Non-Linear Learning Capability', value: best.model === 'RandomForest' || best.model === 'DecisionTree' },
                { label: 'Good Generalization', value: best.std < 0.1 }
              ].map((item, idx) => (
                <li key={idx} className={`flex items-start gap-3 p-2 rounded ${
                  item.value ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <span className={`font-bold mt-0.5 ${item.value ? 'text-green-600' : 'text-gray-400'}`}>
                    {item.value ? '✓' : '○'}
                  </span>
                  <span className={item.value ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tradeoffs */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Important Tradeoffs
          </h3>

          {showAi && aiData.tradeoffs ? (
            <div className="space-y-2 text-sm">
              {aiData.tradeoffs.map((tradeoff, i) => (
                <div key={i} className="p-3 bg-orange-50 border border-orange-200 rounded flex gap-3">
                  <span className="font-bold text-orange-600 flex-shrink-0">⚠</span>
                  <span className="text-gray-800">{tradeoff}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {best.model === 'RandomForest' && (
                <>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded flex gap-3">
                    <span className="font-bold text-orange-600 flex-shrink-0">⚠</span>
                    <span className="text-gray-800"><strong>Inference Speed:</strong> Slower than linear models due to ensemble prediction</span>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded flex gap-3">
                    <span className="font-bold text-orange-600 flex-shrink-0">⚠</span>
                    <span className="text-gray-800"><strong>Explainability:</strong> Less interpretable than decision trees or linear models</span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded flex gap-3">
                    <span className="font-bold text-blue-600 flex-shrink-0">✓</span>
                    <span className="text-gray-800"><strong>Strength:</strong> Handles complex non-linear patterns exceptionally well</span>
                  </div>
                </>
              )}

              {best.model === 'LogisticRegression' && (
                <>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded flex gap-3">
                    <span className="font-bold text-orange-600 flex-shrink-0">⚠</span>
                    <span className="text-gray-800"><strong>Non-Linearity:</strong> Cannot capture non-linear relationships effectively</span>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded flex gap-3">
                    <span className="font-bold text-orange-600 flex-shrink-0">⚠</span>
                    <span className="text-gray-800"><strong>Feature Scaling:</strong> Requires proper normalization/scaling</span>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded flex gap-3">
                    <span className="font-bold text-green-600 flex-shrink-0">✓</span>
                    <span className="text-gray-800"><strong>Strength:</strong> Extremely fast and highly interpretable with feature weights</span>
                  </div>
                </>
              )}

              {best.model === 'DecisionTree' && (
                <>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded flex gap-3">
                    <span className="font-bold text-orange-600 flex-shrink-0">⚠</span>
                    <span className="text-gray-800"><strong>Overfitting Risk:</strong> High tendency to overfit on training data</span>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded flex gap-3">
                    <span className="font-bold text-orange-600 flex-shrink-0">⚠</span>
                    <span className="text-gray-800"><strong>Stability:</strong> Small data changes can significantly alter predictions</span>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded flex gap-3">
                    <span className="font-bold text-green-600 flex-shrink-0">✓</span>
                    <span className="text-gray-800"><strong>Strength:</strong> Highly interpretable with clear decision rules</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Data Quality Notes (AI-only) */}
        {showAi && aiData.data_quality_notes && aiData.data_quality_notes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">📊 Data Quality Notes</h4>
            <ul className="text-sm text-yellow-900 space-y-1 list-disc list-inside">
              {aiData.data_quality_notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Deployment Notes */}
        <div className={`rounded-lg p-4 ${showAi && aiData.deployment_advice ? 'bg-indigo-50 border border-indigo-200' : 'bg-indigo-50 border border-indigo-200'}`}>
          <h4 className="font-semibold text-indigo-900 mb-2">💡 Deployment Notes</h4>
          {showAi && aiData.deployment_advice ? (
            <ul className="text-sm text-indigo-900 space-y-1 list-disc list-inside">
              {aiData.deployment_advice.map((advice, i) => (
                <li key={i}>{advice}</li>
              ))}
            </ul>
          ) : (
            <ul className="text-sm text-indigo-900 space-y-1 list-disc list-inside">
              <li>Ensure feature preprocessing matches training pipeline</li>
              <li>Monitor model performance on new data over time</li>
              <li>Consider ensemble with second-best model for robustness</li>
              <li>Validate on held-out test set before production</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModelRecommendation;
