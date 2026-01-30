export default function RecommendationsPanel({
    title,
    recommendations,
    type,
  }) {
    const getPriorityColor = (priority) => {
      switch (priority) {
        case "high":
          return "border-red-400 bg-red-50";
        case "medium":
          return "border-orange-400 bg-orange-50";
        case "low":
          return "border-blue-400 bg-blue-50";
        default:
          return "border-gray-400 bg-gray-50";
      }
    };
  
    const getPriorityLabel = (priority) => {
      switch (priority) {
        case "high":
          return "🔴 High Priority";
        case "medium":
          return "🟡 Medium Priority";
        case "low":
          return "🟢 Low Priority";
        default:
          return "Priority";
      }
    };
  
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
  
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No recommendations at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`border-l-4 rounded-lg p-4 ${
                  type === "learning"
                    ? getPriorityColor(rec.priority)
                    : "border-blue-400 bg-blue-50"
                }`}
              >
                {type === "learning" && (
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    {getPriorityLabel(rec.priority)}
                  </p>
                )}
                <h4 className="font-bold text-gray-900 mb-1">{rec.title}</h4>
                <p className="text-sm text-gray-700">{rec.description}</p>
                {rec.category && type === "learning" && (
                  <div className="mt-2 inline-block">
                    <span className="text-xs font-medium px-2 py-1 bg-white rounded border border-gray-300 text-gray-600 capitalize">
                      {rec.category}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  