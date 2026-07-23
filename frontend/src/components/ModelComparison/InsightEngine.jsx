import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import AiBadge from "../common/AiBadge";

/**
 * Dynamic Insight Engine
 * Generates intelligent ML engineering insights
 */

function generateDynamicInsights(leaderboard, problemType) {
  const insights = [];

  if (!leaderboard || leaderboard.length < 2) {
    return insights;
  }

  // Sort for comparison
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[leaderboard.length - 1];
  const performanceGap = best.score - worst.score;

  // 1. Performance Gap Insight
  if (performanceGap > 0.15) {
    insights.push({
      type: 'warning',
      title: 'Large Performance Gap',
      description: `${(performanceGap * 100).toFixed(2)}% difference between best and worst model. Model selection is critical.`,
      icon: AlertTriangle
    });
  } else if (performanceGap < 0.03) {
    insights.push({
      type: 'info',
      title: 'Models Perform Similarly',
      description: 'All models achieve similar scores. Dataset may be simple or well-balanced.',
      icon: CheckCircle
    });
  }

  // 2. Model Type Insight
  const bestModelName = best.model;
  if (bestModelName === 'RandomForest') {
    insights.push({
      type: 'success',
      title: 'Non-Linear Patterns Detected',
      description: 'Random Forest dominance suggests complex feature interactions and non-linear relationships in your data.',
      icon: TrendingUp
    });
  } else if (bestModelName === 'LogisticRegression' || bestModelName === 'LinearRegression') {
    insights.push({
      type: 'info',
      title: 'Linear Relationships Likely',
      description: 'Linear model performance indicates your target variable has strong linear relationships with features.',
      icon: TrendingUp
    });
  } else if (bestModelName === 'DecisionTree') {
    insights.push({
      type: 'warning',
      title: 'Tree-Based Solution Needed',
      description: 'Decision trees perform best, but be cautious of overfitting. Consider ensemble methods.',
      icon: AlertTriangle
    });
  }

  // 3. Stability Insight
  if (best.std > 0.08) {
    insights.push({
      type: 'warning',
      title: 'High Model Variance',
      description: `Best model's standard deviation is ${(best.std * 100).toFixed(2)}%. Performance varies across folds - dataset may be noisy.`,
      icon: AlertTriangle
    });
  } else if (best.std < 0.03) {
    insights.push({
      type: 'success',
      title: 'Excellent Stability',
      description: 'Model performance is consistent across cross-validation folds. High confidence in predictions.',
      icon: CheckCircle
    });
  }

  // 4. Comparison Insight
  if (leaderboard.length > 1) {
    const secondBest = sorted[1];
    const gap = best.score - secondBest.score;
    if (gap < 0.02) {
      insights.push({
        type: 'info',
        title: 'Consider Ensemble',
        description: `${best.model} and ${secondBest.model} perform similarly. Ensemble them for potential improvement.`,
        icon: TrendingUp
      });
    }
  }

  // 5. Data Complexity
  const avgScore = leaderboard.reduce((sum, m) => sum + m.score, 0) / leaderboard.length;
  if (avgScore > 0.9) {
    insights.push({
      type: 'success',
      title: 'Well-Structured Data',
      description: 'High average model performance suggests clean, well-structured data with clear predictive patterns.',
      icon: CheckCircle
    });
  } else if (avgScore < 0.6) {
    insights.push({
      type: 'warning',
      title: 'Challenging Dataset',
      description: 'Low model performance across all algorithms. Consider feature engineering or collecting more data.',
      icon: AlertTriangle
    });
  }

  // 6. Production Recommendation
  const bestStability = best.std < 0.05;
  const bestScore = best.score > 0.8;
  if (bestScore && bestStability) {
    insights.push({
      type: 'success',
      title: 'Production Ready',
      description: `${best.model} achieves high performance (${(best.score * 100).toFixed(1)}%) with excellent stability. Suitable for production.`,
      icon: CheckCircle
    });
  } else if (bestScore && !bestStability) {
    insights.push({
      type: 'warning',
      title: 'Validate Before Production',
      description: `High performance but variable across folds. Extensive testing on held-out data recommended before deployment.`,
      icon: AlertTriangle
    });
  }

  return insights;
}

function InsightEngine({ leaderboard, problemType, aiResult, aiStatus }) {
  const staticInsights = generateDynamicInsights(leaderboard, problemType);
  const showAi = aiStatus === "loaded" && aiResult?.data != null;
  const aiData = aiResult?.data;

  const hasStatic = staticInsights.length > 0;
  const hasAiSummary = showAi && aiData.summary;

  if (!hasStatic && !hasAiSummary) return null;

  return (
    <div className={`space-y-3 ${aiStatus === "loading" ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900">Key Insights</h3>
        </div>
        <AiBadge aiStatus={showAi ? "loaded" : aiStatus} />
      </div>

      {/* AI Summary */}
      {hasAiSummary && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-900">
          <p className="font-semibold mb-1">AI Overview</p>
          <p>{aiData.summary}</p>
        </div>
      )}

      <div className="space-y-3">
        {staticInsights.map((insight, idx) => {
          const Icon = insight.icon;
          const bgColor = {
            success: 'bg-green-50 border-green-200 border-l-4 border-l-green-500',
            warning: 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500',
            info: 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500'
          }[insight.type];

          const textColor = {
            success: 'text-green-900',
            warning: 'text-yellow-900',
            info: 'text-blue-900'
          }[insight.type];

          const iconColor = {
            success: 'text-green-600',
            warning: 'text-yellow-600',
            info: 'text-blue-600'
          }[insight.type];

          return (
            <div key={idx} className={`p-4 rounded-lg ${bgColor}`}>
              <div className="flex gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${textColor}`}>{insight.title}</div>
                  <p className={`text-sm mt-1 ${textColor}`}>{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InsightEngine;
export { generateDynamicInsights };
