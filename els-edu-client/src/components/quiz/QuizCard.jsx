import React from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, Clock, Award } from "lucide-react";

const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-700 border-green-200",
  intermediate: "bg-yellow-100 text-yellow-700 border-yellow-200",
  advanced: "bg-red-100 text-red-700 border-red-200",
};

const QuizCard = ({ quiz }) => {
  const navigate = useNavigate();
  const questionCount = quiz?.questions?.length || 0;
  const difficultyColor =
    DIFFICULTY_COLORS[quiz?.difficulty] ||
    "bg-gray-100 text-gray-700 border-gray-200";

  const handleStartQuiz = () => {
    navigate(`/quiz/${quiz.id}/play`);
  };

  return (
    <div className="group relative bg-white rounded-3xl border-2 border-gray-100 hover:border-violet-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
      {/* Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-bl-full -z-0" />

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-black text-gray-800 mb-1 line-clamp-2 group-hover:text-violet-600 transition-colors">
              {quiz.title}
            </h3>
            {quiz.description && (
              <p className="text-sm text-gray-500 line-clamp-2 font-medium">
                {quiz.description.replace(/<[^>]*>/g, "")}
              </p>
            )}
          </div>

          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <PlayCircle className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div
            className={`px-3 py-1 rounded-full border-2 font-bold ${difficultyColor}`}
          >
            {quiz.difficulty}
          </div>

          <div className="flex items-center gap-1.5 text-gray-600">
            <Award className="w-4 h-4" />
            <span className="font-semibold">{questionCount} Questions</span>
          </div>

          {quiz.timeLimit && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{quiz.timeLimit} min</span>
            </div>
          )}
        </div>

        {/* Passing Score */}
        {quiz.passingScore && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold">Passing Score:</span>
            <span>{quiz.passingScore}%</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleStartQuiz}
          className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-black rounded-2xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-5 h-5" />
          Start Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
