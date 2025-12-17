import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Layers } from "lucide-react";

const GRADE_COLORS = {
  PLAYSCHOOL: "bg-pink-100 text-pink-700",
  LKG: "bg-purple-100 text-purple-700",
  UKG: "bg-indigo-100 text-indigo-700",
  FIRST: "bg-blue-100 text-blue-700",
  SECOND: "bg-cyan-100 text-cyan-700",
  THIRD: "bg-teal-100 text-teal-700",
  FOURTH: "bg-green-100 text-green-700",
  FIFTH: "bg-lime-100 text-lime-700",
  SIXTH: "bg-yellow-100 text-yellow-700",
  SEVENTH: "bg-amber-100 text-amber-700",
  EIGHTH: "bg-orange-100 text-orange-700",
  NINTH: "bg-red-100 text-red-700",
  TENTH: "bg-rose-100 text-rose-700",
};

const SubjectCard = ({ subject }) => {
  const navigate = useNavigate();
  const topicCount = subject?.topics?.length || 0;
  const quizCount = subject?.quizzes?.length || 0;
  const gradeColor =
    GRADE_COLORS[subject?.grade] || "bg-gray-100 text-gray-700";

  const handleClick = () => {
    // Use documentId for Strapi v5
    navigate(`/browse-subjects/${subject.documentId || subject.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-3xl border-2 border-gray-100 hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2"
    >
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/20 overflow-hidden">
        {subject?.coverpage?.url ? (
          <img
            src={subject.coverpage.url}
            alt={subject.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-primary/30" />
          </div>
        )}

        {/* Grade Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black ${gradeColor} shadow-md`}
          >
            {subject?.grade?.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-black text-gray-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {subject.name}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span className="font-semibold">{topicCount} Topics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold">{quizCount} Quizzes</span>
          </div>
        </div>

        {/* Level Indicator */}
        {subject?.level && (
          <div className="mt-3 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < subject.level
                    ? "bg-gradient-to-r from-primary to-secondary"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default SubjectCard;
