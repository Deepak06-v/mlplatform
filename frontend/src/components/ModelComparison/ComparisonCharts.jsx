import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

/**
 * Comprehensive Model Comparison Charts
 * Uses Recharts for interactive visualizations
 */

function ComparisonCharts({ leaderboard, problemType }) {
  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  // Data for bar chart
  const scoreData = leaderboard.map((item, idx) => ({
    name: item.model,
    score: parseFloat((item.score * 100).toFixed(2)),
    std: parseFloat((item.std * 100).toFixed(2)),
    rank: idx + 1
  }));

  // Data for radar chart (model characteristics)
  const radarData = leaderboard.map((item) => {
    const isRF = item.model === 'RandomForest';
    const isLR = item.model === 'LogisticRegression';
    const isDT = item.model === 'DecisionTree';

    return {
      model: item.model,
      'Performance': item.score * 100,
      'Interpretability': isLR || isDT ? 90 : isRF ? 60 : 70,
      'Training Speed': isLR ? 95 : isDT ? 90 : isRF ? 70 : 80,
      'Scalability': isRF ? 90 : isLR ? 95 : isDT ? 75 : 80,
      'Non-Linearity': isRF ? 95 : isDT ? 90 : isLR ? 30 : 50,
      'Stability': (1 - item.std) * 100
    };
  });

  const COLORS = ['#4F46E5', '#06B6D4', '#EC4899', '#F59E0B', '#10B981'];

  const METRIC_NAMES = ['Performance', 'Interpretability', 'Training Speed', 'Scalability', 'Non-Linearity', 'Stability'];

  return (
    <div className="space-y-6">
      
      {/* Performance Comparison */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Performance Scores</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" />
            <YAxis stroke="#6B7280" label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
              formatter={(value) => `${value.toFixed(2)}%`}
            />
            <Legend />
            <Bar dataKey="score" fill="#4F46E5" name="CV Score %" radius={[8, 8, 0, 0]} />
            <Bar dataKey="std" fill="#F59E0B" name="Std Dev %" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
          <strong>Interpretation:</strong> Higher CV Score indicates better performance. Lower Std Dev indicates more stable predictions across folds.
        </div>
      </div>

      {/* Model Characteristics Radar */}
      {leaderboard.length > 1 && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-bold text-gray-900">Model Characteristics Comparison</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {radarData.slice(0, 3).map((data, idx) => (
              <ResponsiveContainer key={idx} width="100%" height={300}>
                <RadarChart data={[data]} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                  <PolarAngleAxis
                    dataKey="model"
                    stroke="#6B7280"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    stroke="#E5E7EB"
                    style={{ fontSize: '12px' }}
                  />
                  <Radar
                    name={data.model}
                    dataKey="Performance"
                    stroke={COLORS[idx]}
                    fill={COLORS[idx]}
                    fillOpacity={0.25}
                  />
                  <Radar
                    name="Interpretability"
                    dataKey="Interpretability"
                    stroke="#F59E0B"
                    fillOpacity={0}
                  />
                  <Radar
                    name="Training Speed"
                    dataKey="Training Speed"
                    stroke="#10B981"
                    fillOpacity={0}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                    formatter={(value) => `${value.toFixed(1)}`}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ))}
          </div>

          <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-sm text-gray-700">
            <strong>Note:</strong> Radar charts show model strengths and weaknesses across key dimensions. Larger areas indicate better overall characteristics.
          </div>
        </div>
      )}

      {/* Stability Comparison */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cross-Validation Stability</h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={scoreData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" />
            <YAxis stroke="#6B7280" label={{ value: 'Std Dev (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }} />
            <Legend />
            <Line
              type="monotone"
              dataKey="std"
              stroke="#EC4899"
              strokeWidth={2}
              dot={{ fill: '#EC4899', r: 5 }}
              activeDot={{ r: 7 }}
              name="Standard Deviation"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 p-3 bg-pink-50 border border-pink-200 rounded-lg text-sm text-gray-700">
          <strong>What this means:</strong> Lower standard deviation = more stable model across cross-validation folds. <strong>Green zone (&lt;5%)</strong> is excellent, <strong>Yellow zone (5-10%)</strong> is good, <strong>Red zone (&gt;10%)</strong> indicates instability.
        </div>
      </div>
    </div>
  );
}

export default ComparisonCharts;
