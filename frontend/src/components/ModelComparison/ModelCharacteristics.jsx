import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * Model Characteristics Card
 * Shows meaningful, real-world model properties instead of raw hyperparameters
 */

const MODEL_METADATA = {
  // Classification Models
  'LogisticRegression': {
    type: 'Linear Classification Model',
    learningStyle: 'Supervised',
    interpretability: 'Very High',
    trainingSpeed: 'Very Fast',
    inferenceSpeed: 'Very Fast',
    overfittingRisk: 'Low',
    scalability: 'Excellent',
    handlesNonLinearity: 'Poorly',
    requiresFeatureScaling: true,
    handlesImbalance: false,
    bestUseCases: [
      'Baseline binary classification',
      'Linearly separable problems',
      'Production inference speed critical',
      'Explainability required'
    ],
    suitableDatasetSize: 'Any (100s to millions)',
    suitableProblemType: 'Binary/Multiclass classification',
    structuredCompatibility: 'Excellent',
    unstructuredCompatibility: 'Poor',
    productionReadiness: 'Very High',
    explainabilityScore: 95
  },

  'DecisionTree': {
    type: 'Tree-Based Model',
    learningStyle: 'Supervised',
    interpretability: 'Very High',
    trainingSpeed: 'Very Fast',
    inferenceSpeed: 'Very Fast',
    overfittingRisk: 'Very High',
    scalability: 'Good',
    handlesNonLinearity: 'Yes',
    requiresFeatureScaling: false,
    handlesImbalance: false,
    bestUseCases: [
      'Explainable decision systems',
      'Feature interactions',
      'Small to medium datasets',
      'Rule extraction'
    ],
    suitableDatasetSize: '100s to 100,000s',
    suitableProblemType: 'Classification & Regression',
    structuredCompatibility: 'Excellent',
    unstructuredCompatibility: 'Poor',
    productionReadiness: 'Medium',
    explainabilityScore: 98
  },

  'RandomForest': {
    type: 'Ensemble Tree Model',
    learningStyle: 'Supervised',
    interpretability: 'Medium',
    trainingSpeed: 'Medium',
    inferenceSpeed: 'Fast',
    overfittingRisk: 'Low',
    scalability: 'Excellent',
    handlesNonLinearity: 'Yes',
    requiresFeatureScaling: false,
    handlesImbalance: false,
    bestUseCases: [
      'Complex feature interactions',
      'Tabular/structured data',
      'Non-linear relationships',
      'Robust general-purpose model'
    ],
    suitableDatasetSize: '1,000s to millions',
    suitableProblemType: 'Classification & Regression',
    structuredCompatibility: 'Excellent',
    unstructuredCompatibility: 'Poor',
    productionReadiness: 'High',
    explainabilityScore: 65
  },

  'LinearRegression': {
    type: 'Linear Regression Model',
    learningStyle: 'Supervised',
    interpretability: 'Very High',
    trainingSpeed: 'Very Fast',
    inferenceSpeed: 'Very Fast',
    overfittingRisk: 'Low',
    scalability: 'Excellent',
    handlesNonLinearity: 'Poorly',
    requiresFeatureScaling: true,
    handlesImbalance: false,
    bestUseCases: [
      'Baseline regression',
      'Linear relationships',
      'Interpretable predictions',
      'Feature importance analysis'
    ],
    suitableDatasetSize: 'Any (100s to millions)',
    suitableProblemType: 'Continuous regression',
    structuredCompatibility: 'Excellent',
    unstructuredCompatibility: 'Poor',
    productionReadiness: 'Very High',
    explainabilityScore: 95
  }
};

function ModelCharacteristics({ modelName, score, rank, totalModels }) {
  const [expanded, setExpanded] = useState(false);
  const metadata = MODEL_METADATA[modelName] || MODEL_METADATA['RandomForest'];

  const getRiskColor = (risk) => {
    if (risk === 'Very High') return 'text-red-600 bg-red-50';
    if (risk === 'High') return 'text-orange-600 bg-orange-50';
    if (risk === 'Medium') return 'text-yellow-600 bg-yellow-50';
    if (risk === 'Low') return 'text-green-600 bg-green-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getSpeedColor = (speed) => {
    if (speed === 'Very Fast') return 'text-green-600 bg-green-50';
    if (speed === 'Fast') return 'text-emerald-600 bg-emerald-50';
    if (speed === 'Medium') return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getInterpretabilityColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className={`rounded-xl border-2 transition-all duration-200 ${
      expanded 
        ? 'border-blue-500 bg-blue-50 shadow-lg' 
        : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 text-left flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
            rank === 1 ? 'bg-yellow-500' :
            rank === 2 ? 'bg-gray-400' :
            rank === 3 ? 'bg-orange-600' :
            'bg-blue-500'
          }`}>
            {rank}
          </div>
          
          <div className="flex-1">
            <div className="font-bold text-lg text-gray-900">{modelName}</div>
            <div className="text-sm text-gray-600">{metadata.type}</div>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold text-blue-600">{(score * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-500">CV Score</div>
          </div>
        </div>

        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-200 p-6 space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">INTERPRETABILITY</div>
              <div className={`text-lg font-bold ${getInterpretabilityColor(metadata.explainabilityScore)}`}>
                {metadata.explainabilityScore}/100
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">TRAIN SPEED</div>
              <div className={`text-sm font-bold ${getSpeedColor(metadata.trainingSpeed)}`}>
                {metadata.trainingSpeed}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">OVERFIT RISK</div>
              <div className={`text-sm font-bold ${getRiskColor(metadata.overfittingRisk)}`}>
                {metadata.overfittingRisk}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">INFERENCE</div>
              <div className={`text-sm font-bold ${getSpeedColor(metadata.inferenceSpeed)}`}>
                {metadata.inferenceSpeed}
              </div>
            </div>
          </div>

          {/* Key Characteristics */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Model Characteristics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-white rounded border border-gray-200">
                <span className="text-gray-700">Feature Scaling Required</span>
                <span className={`font-semibold ${metadata.requiresFeatureScaling ? 'text-orange-600' : 'text-green-600'}`}>
                  {metadata.requiresFeatureScaling ? '✓ Yes' : '✗ No'}
                </span>
              </div>

              <div className="flex justify-between p-2 bg-white rounded border border-gray-200">
                <span className="text-gray-700">Handles Non-Linearity</span>
                <span className={`font-semibold ${
                  metadata.handlesNonLinearity === 'Yes' ? 'text-green-600' :
                  metadata.handlesNonLinearity === 'Poorly' ? 'text-orange-600' :
                  'text-blue-600'
                }`}>
                  {metadata.handlesNonLinearity}
                </span>
              </div>

              <div className="flex justify-between p-2 bg-white rounded border border-gray-200">
                <span className="text-gray-700">Scalability</span>
                <span className="font-semibold text-blue-600">{metadata.scalability}</span>
              </div>

              <div className="flex justify-between p-2 bg-white rounded border border-gray-200">
                <span className="text-gray-700">Structured Data Compatibility</span>
                <span className="font-semibold text-green-600">{metadata.structuredCompatibility}</span>
              </div>

              <div className="flex justify-between p-2 bg-white rounded border border-gray-200">
                <span className="text-gray-700">Production Readiness</span>
                <span className={`font-semibold ${
                  metadata.productionReadiness === 'Very High' ? 'text-green-600' :
                  metadata.productionReadiness === 'High' ? 'text-emerald-600' :
                  'text-yellow-600'
                }`}>
                  {metadata.productionReadiness}
                </span>
              </div>
            </div>
          </div>

          {/* Best Use Cases */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Best For</h4>
            <ul className="space-y-1 text-sm">
              {metadata.bestUseCases.map((useCase, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dataset Size & Problem Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <div className="text-xs font-semibold text-purple-700 mb-1">SUITABLE DATASET SIZE</div>
              <div className="text-sm font-semibold text-purple-900">{metadata.suitableDatasetSize}</div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
              <div className="text-xs font-semibold text-indigo-700 mb-1">SUITABLE PROBLEM TYPE</div>
              <div className="text-sm font-semibold text-indigo-900">{metadata.suitableProblemType}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelCharacteristics;
