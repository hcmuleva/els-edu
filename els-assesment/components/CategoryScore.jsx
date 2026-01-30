import { getLevelColor } from "@/lib/assessmentUtils";

export default function CategoryScore({ category, score, level }) {
  const percentage = (score / 10) * 100;
  const categoryIcons = {
    development: "💻",
    testing: "🧪",
    devops: "⚙️",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 capitalize">
          <span className="mr-2">{categoryIcons[category]}</span>
          {category}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(
            level
          )}`}
        >
          {level}
        </span>
      </div>

      {/* Score Display */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-blue-600">{score.toFixed(1)}</p>
        <p className="text-sm text-gray-500">out of 10</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Percentage */}
      <p className="text-sm text-gray-600 mt-2 text-right">{percentage.toFixed(0)}%</p>
    </div>
  );
}
