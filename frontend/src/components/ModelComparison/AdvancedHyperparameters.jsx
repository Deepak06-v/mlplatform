import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * Advanced Hyperparameters Section
 * Hidden by default, expandable to show raw sklearn parameters
 */

function AdvancedHyperparameters({ leaderboard }) {
  const [expandedModel, setExpandedModel] = useState(null);

  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  // Filter out useless default parameters
  const USELESS_PARAMS = [
    'ccp_alpha',
    'class_weight',
    'bootstrap',
    'random_state',
    'verbose',
    'warm_start',
    'n_jobs',
    'oob_score',
    'presort',
    'copy_X',
    'positive'
  ];

  const filterParams = (params) => {
    if (!params || typeof params !== 'object') return {};
    
    const filtered = {};
    for (const [key, value] of Object.entries(params)) {
      if (!USELESS_PARAMS.includes(key) && value !== null && value !== undefined) {
        filtered[key] = value;
      }
    }
    return filtered;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Advanced Hyperparameters</h3>
        <p className="text-sm text-gray-600 mt-1">Raw sklearn configuration for each model (defaults hidden)</p>
      </div>

      {/* Models List */}
      <div className="divide-y divide-gray-200">
        {leaderboard.map((item, idx) => {
          const filteredParams = filterParams(item.params);
          const hasParams = Object.keys(filteredParams).length > 0;
          const isExpanded = expandedModel === idx;

          return (
            <div key={idx}>
              <button
                onClick={() => setExpandedModel(isExpanded ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.model}</div>
                    <div className="text-xs text-gray-500">
                      {hasParams
                        ? `${Object.keys(filteredParams).length} custom parameters`
                        : 'Using default parameters'}
                    </div>
                  </div>
                </div>

                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  {hasParams ? (
                    <div className="space-y-2">
                      {Object.entries(filteredParams).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-3 p-2 bg-white rounded border border-gray-200">
                          <span className="font-mono text-sm font-bold text-indigo-600 min-w-fit">{key}:</span>
                          <span className="font-mono text-sm text-gray-700 break-all">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                      This model uses all default sklearn parameters. No custom hyperparameters were set.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-3">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> The following default parameters are hidden for clarity: ccp_alpha, class_weight, bootstrap, random_state, verbose, warm_start, n_jobs, oob_score. These rarely affect performance significantly.
        </p>
      </div>
    </div>
  );
}

export default AdvancedHyperparameters;
