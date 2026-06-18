import { Zap, Loader } from 'lucide-react';
import ModelCharacteristics from './ModelCharacteristics';
import PerformanceMetrics from './PerformanceMetrics';
import ModelRecommendation from './ModelRecommendation';
import ComparisonCharts from './ComparisonCharts';
import AdvancedHyperparameters from './AdvancedHyperparameters';
import InsightEngine from './InsightEngine';

/**
 * Model Comparison Dashboard
 * Professional, production-grade ML model comparison interface
 */

function ModelComparisonDashboard({ leaderboard, bestModel, recommendation, problemType, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Comparing models...</p>
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
        <p className="text-yellow-800">No models to compare. Train models first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Model Comparison Dashboard</h1>
        </div>
        <p className="text-indigo-100 mt-2">
          {leaderboard.length} models evaluated using cross-validation. Discover the best model for your dataset.
        </p>
      </div>

      {/* Top Section: Recommendation + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation (Spans 2 columns) */}
        <div className="lg:col-span-2">
          <ModelRecommendation
            bestModel={bestModel}
            leaderboard={leaderboard}
            recommendation={recommendation}
            problemType={problemType}
          />
        </div>

        {/* Insights (Right column) */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <InsightEngine leaderboard={leaderboard} problemType={problemType} />
        </div>
      </div>

      {/* Charts Section */}
      <ComparisonCharts leaderboard={leaderboard} problemType={problemType} />

      {/* Model Cards Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Model Characteristics</h2>
        <div className="space-y-4">
          {leaderboard.map((model, idx) => (
            <ModelCharacteristics
              key={idx}
              modelName={model.model}
              score={model.score}
              rank={idx + 1}
              totalModels={leaderboard.length}
            />
          ))}
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <PerformanceMetrics
          leaderboard={leaderboard}
          problemType={problemType}
        />
      </div>

      {/* Advanced Settings */}
      <AdvancedHyperparameters leaderboard={leaderboard} />

      {/* Footer Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3">📋 About This Dashboard</h3>
        <ul className="text-sm text-blue-900 space-y-2 list-disc list-inside">
          <li><strong>CV Score:</strong> Cross-validation score (average across 5 folds)</li>
          <li><strong>Stability (Std):</strong> Standard deviation of scores - lower is better (more consistent)</li>
          <li><strong>Model Characteristics:</strong> Real-world properties that matter for ML decisions</li>
          <li><strong>Advanced Hyperparameters:</strong> Raw sklearn configuration (useless defaults hidden)</li>
          <li><strong>Recommendation:</strong> Best model based on performance, stability, and practical considerations</li>
        </ul>
      </div>
    </div>
  );
}

export default ModelComparisonDashboard;
