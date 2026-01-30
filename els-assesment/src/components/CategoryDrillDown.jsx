import { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, CheckCircle2, AlertCircle, Target } from 'lucide-react';

export default function CategoryDrillDown({ drillDownData, onClose, userProfile }) {
  if (!drillDownData) return null;

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const { overview, skillBreakdown, charts, strengths, gaps, quizEligibility, recommendations } = drillDownData;

  // Color mapping for bars
  const getBarColor = (rating) => {
    if (rating >= 7) return '#10b981'; // green
    if (rating >= 6) return '#3b82f6'; // blue
    if (rating >= 5) return '#f59e0b'; // yellow
    if (rating >= 4) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const chartData = charts.barChart.labels.map((label, index) => ({
    skill: label,
    rating: charts.barChart.values[index]
  }));

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-700 bg-green-100';
      case 'Good': return 'text-blue-700 bg-blue-100';
      case 'Average': return 'text-yellow-700 bg-yellow-100';
      case 'Needs Improvement': return 'text-orange-700 bg-orange-100';
      case 'Weak': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="min-h-screen px-4 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-2xl">
          {/* Professional Header with Company Branding */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
            {/* Company Branding */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-500/30">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Emeelan Logo" 
                  className="h-10 w-auto object-contain bg-white/10 p-1 rounded"
                />
                <div>
                  <h3 className="text-lg font-bold">Emeelan</h3>
                  <p className="text-xs text-blue-200">Experiential Learning System</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-200">
                  {userProfile?.name || "User"} • {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Category Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">{drillDownData.category} Drill-Down</h2>
                <p className="text-blue-100">{overview.summary}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-600 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Overview Cards */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-200">Overall Score</p>
                <p className="text-3xl font-bold">{overview.score.toFixed(1)}/10</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-200">Level</p>
                <p className="text-3xl font-bold">{overview.level}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-200">Skills Assessed</p>
                <p className="text-3xl font-bold">{skillBreakdown.length}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Skill Breakdown Chart */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Skill Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="skill" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="rating" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.rating)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Skill Breakdown Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Detailed Skill Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Skill</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Rating</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillBreakdown.map((skill, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{skill.skill}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-lg font-bold text-blue-600">{skill.rating}/10</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(skill.status)}`}>
                            {skill.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">{skill.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strengths and Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle2 className="text-green-600 mr-2" size={24} />
                  <h3 className="text-xl font-bold text-green-800">💪 Strengths</h3>
                </div>
                {strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-green-700 capitalize">{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-600">Continue building on your current foundation</p>
                )}
              </div>

              {/* Gaps */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="text-orange-600 mr-2" size={24} />
                  <h3 className="text-xl font-bold text-orange-800">⚠️ Areas for Improvement</h3>
                </div>
                {gaps.length > 0 ? (
                  <ul className="space-y-2">
                    {gaps.map((gap, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-600 mr-2">•</span>
                        <span className="text-orange-700 capitalize">{gap}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-orange-600">Great job! Keep maintaining your skills</p>
                )}
              </div>
            </div>

            {/* Quiz Eligibility */}
            {quizEligibility.eligible && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="text-green-600 mr-3" size={28} />
                    <div>
                      <h3 className="text-xl font-bold text-green-800">🎯 Quiz Eligible</h3>
                      <p className="text-green-700 mt-1">
                        You're ready for the {drillDownData.category} quiz at {quizEligibility.recommendedLevel} level
                      </p>
                      {quizEligibility.focusAreas.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          Focus areas: {quizEligibility.focusAreas.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Start Quiz
                  </button>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-4">🧭 Learning Path Recommendations</h3>
              
              <div className="mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">Recommended Actions:</h4>
                <ul className="space-y-2">
                  {recommendations.learningActions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">→</span>
                      <span className="text-blue-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-blue-300 pt-4 mt-4">
                <p className="text-sm text-blue-600 mb-1">
                  <span className="font-semibold">ELS Path:</span> {recommendations.elsPath}
                </p>
                <p className="text-sm text-blue-600">
                  <span className="font-semibold">Expected Outcome:</span> {recommendations.expectedOutcome}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

