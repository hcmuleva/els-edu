export default function SkillGapsDisplay({ skillGaps }) {
    const allGaps = Object.entries(skillGaps).filter(([_, gaps]) => gaps.length > 0);
  
    if (allGaps.length === 0) {
      return (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-700 mb-2">✅ No Critical Gaps</h3>
          <p className="text-green-600">
            You have demonstrated solid knowledge across all skill areas!
          </p>
        </div>
      );
    }
  
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Skill Gaps Identified</h2>
        <div className="space-y-4">
          {allGaps.map(([category, gaps]) => (
            <div key={category} className="border-l-4 border-orange-400 pl-4 py-2">
              <h3 className="font-semibold text-gray-900 capitalize mb-2">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {gaps.map((gap) => (
                  <div
                    key={gap.skill}
                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span className="font-medium">{gap.skill}</span>
                    <span className="text-orange-600 ml-2">({gap.rating}/10)</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>💡 Tip:</strong> Focus on these areas to improve your overall
            proficiency. Consider taking targeted learning modules.
          </p>
        </div>
      </div>
    );
  }

