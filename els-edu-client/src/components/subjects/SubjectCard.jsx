import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Layers, Sparkles } from "lucide-react";

const GRADE_COLORS = {
  PLAYSCHOOL: {
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
  },
  LKG: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
  },
  UKG: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
  },
  FIRST: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  SECOND: {
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    border: "border-cyan-200",
  },
  THIRD: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
  FOURTH: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  FIFTH: { bg: "bg-lime-50", text: "text-lime-600", border: "border-lime-200" },
  SIXTH: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-200",
  },
  SEVENTH: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  EIGHTH: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  NINTH: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  TENTH: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
};

const SubjectCard = ({ subject }) => {
  const navigate = useNavigate();
  const topicCount = subject?.topics?.length || 0;
  const quizCount = subject?.quizzes?.length || 0;
  const gradeColor = GRADE_COLORS[subject?.grade] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  };

  const handleClick = () => {
    navigate(`/browse-subjects/${subject.documentId || subject.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all overflow-hidden cursor-pointer"
    >
      {/* Cover Image */}
      <div className="relative h-36 bg-gradient-to-br from-primary-50 via-violet-50 to-pink-50 overflow-hidden">
        {subject?.coverpage?.url ? (
          <img
            src={subject.coverpage.url}
            alt={subject.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center shadow-sm">
              <Sparkles className="w-8 h-8 text-primary-400" />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Grade Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${gradeColor.bg} ${gradeColor.text} border ${gradeColor.border} backdrop-blur-sm`}
          >
            {subject?.grade?.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">
          {subject.name}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-medium">{topicCount} topics</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-200" />
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="font-medium">{quizCount} quizzes</span>
          </div>
        </div>

        {/* Level Indicator */}
        {subject?.level && (
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < subject.level
                    ? "bg-gradient-to-r from-primary-500 to-violet-500"
                    : "bg-gray-100"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectCard;
