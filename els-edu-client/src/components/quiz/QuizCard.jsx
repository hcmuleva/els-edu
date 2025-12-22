import React from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, Clock, Award, Layers } from "lucide-react";

const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-50 text-emerald-600 border-emerald-200",
  intermediate: "bg-amber-50 text-amber-600 border-amber-200",
  advanced: "bg-rose-50 text-rose-600 border-rose-200",
};

const QuizCard = ({
  quiz,
  questionCount: propQuestionCount,
  attemptsUsed = 0,
}) => {
  const navigate = useNavigate();
  const questionCount = propQuestionCount ?? quiz?.questions?.length ?? 0;
  const maxAttempts = quiz?.maxAttempts ?? 0;
  const isUnlimited = maxAttempts === 0;
  const difficultyColor =
    DIFFICULTY_COLORS[quiz?.difficulty] ||
    "bg-gray-50 text-gray-600 border-gray-200";

  const handleStartQuiz = () => {
    const quizId = quiz.documentId || quiz.id;
    navigate(`/quiz/${quizId}/play`);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all overflow-hidden flex flex-col h-full">
      {/* Gradient Background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-50 to-violet-50 rounded-bl-full -z-0 opacity-50" />

      {/* Content - Flex column with flex-1 for description to push button down */}
      <div className="relative p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-h-[60px]">
            {/*Fixed height container for title */}
            <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
              {quiz.title}
            </h3>
          </div>

          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Description - Fixed height container */}
        {quiz.description && (
          <div className="mb-3 min-h-[40px]">
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {quiz.description.replace(/<[^>]*>/g, "")}
            </p>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-3">
          <div
            className={`px-2.5 py-1 rounded-lg border font-semibold ${difficultyColor}`}
          >
            {quiz.difficulty}
          </div>

          <div className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span className="font-medium">{questionCount} Q</span>
          </div>

          {quiz.timeLimit && (
            <>
              <div className="w-1 h-1 rounded-full bg-gray-200" />
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{quiz.timeLimit}m</span>
              </div>
            </>
          )}

          <div className="w-1 h-1 rounded-full bg-gray-200" />
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-medium">
              {isUnlimited ? (
                <span className="text-emerald-600">∞</span>
              ) : (
                <span
                  className={attemptsUsed >= maxAttempts ? "text-rose-500" : ""}
                >
                  {attemptsUsed}/{maxAttempts}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Passing Score */}
        {quiz.passingScore && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <span className="font-medium">Passing Score:</span>
            <span className="font-semibold text-gray-600">
              {quiz.passingScore}%
            </span>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Action Button - Always at bottom */}
        <button
          onClick={handleStartQuiz}
          disabled={!isUnlimited && attemptsUsed >= maxAttempts}
          className={`w-full px-4 py-2.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-auto ${
            !isUnlimited && attemptsUsed >= maxAttempts
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-primary-500 to-violet-500 text-white hover:from-primary-600 hover:to-violet-600 shadow-sm group-hover:scale-[1.02]"
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          {!isUnlimited && attemptsUsed >= maxAttempts
            ? "No Attempts Left"
            : "Start Quiz"}
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
