export default function QuizEligibility({ quizEligibility, categoryScores }) {
    const eligibleQuizzes = Object.entries(quizEligibility).filter(
      ([_, eligible]) => eligible
    );
  
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Quiz Eligibility</h2>
  
        {eligibleQuizzes.length > 0 ? (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              You are eligible for quizzes in the following categories:
            </p>
            {eligibleQuizzes.map(([category]) => (
              <div
                key={category}
                className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <h4 className="font-bold text-gray-900 capitalize">{category}</h4>
                    <p className="text-sm text-gray-600">
                      Score: {categoryScores[category].toFixed(1)}/10
                    </p>
                  </div>
                </div>
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
            <p className="text-amber-800 font-medium mb-2">
              🔒 Not Yet Eligible for Quizzes
            </p>
            <p className="text-amber-700">
              You need to score at least 6.0 in at least one category. Complete
              relevant learning modules first.
            </p>
          </div>
        )}
  
        {/* Ineligible Categories Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">
            Categories Needing Development
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(quizEligibility).map(([category, eligible]) => {
              if (eligible) return null;
              return (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900 capitalize mb-1">
                    {category}
                  </p>
                  <p className="text-sm text-gray-600">
                    Score: {categoryScores[category].toFixed(1)}/10
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Need: {(6 - categoryScores[category]).toFixed(1)} more points
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

