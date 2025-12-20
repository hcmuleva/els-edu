import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Layers, Play, Calendar } from "lucide-react";

const CATEGORY_COLORS = {
  KIDS: "bg-pink-100 text-pink-700",
  PRIMARY: "bg-blue-100 text-blue-700",
  MIDDLE: "bg-purple-100 text-purple-700",
  SCHOOL: "bg-indigo-100 text-indigo-700",
  COLLEGE: "bg-teal-100 text-teal-700",
  SANSKAR: "bg-amber-100 text-amber-700",
  EDUCATION: "bg-green-100 text-green-700",
};

/**
 * CourseCard - Displays a subscribed course with cover, description, and Start button
 */
const CourseCard = ({ subscription, showStartButton = true }) => {
  const navigate = useNavigate();
  const course = subscription?.course;

  if (!course) return null;

  const subjectCount =
    subscription?.subjects?.length || course?.subjects?.length || 0;
  const categoryColor =
    CATEGORY_COLORS[course.category] || "bg-gray-100 text-gray-700";

  // Get cover image URL
  const getCoverUrl = () => {
    if (!course.cover) return null;
    if (typeof course.cover === "string") return course.cover;
    return (
      course.cover?.url ||
      course.cover?.formats?.medium?.url ||
      course.cover?.formats?.small?.url ||
      course.cover?.formats?.thumbnail?.url
    );
  };

  const coverUrl = getCoverUrl();

  const handleStart = (e) => {
    e.stopPropagation();
    navigate(`/my-subscriptions/${course.documentId}`);
  };

  const handleCardClick = () => {
    navigate(`/my-subscriptions/${course.documentId}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-3xl border-2 border-gray-100 hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2"
    >
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/20 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={course.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GraduationCap className="w-20 h-20 text-primary/30" />
          </div>
        )}

        {/* Category Badge */}
        {course.category && (
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${categoryColor} shadow-md`}
            >
              {course.category}
            </span>
          </div>
        )}

        {/* Subscription Status Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700 shadow-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {subscription.subscription_type || "FREE"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-xl font-black text-gray-800 line-clamp-2 group-hover:text-primary transition-colors">
          {course.name}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {typeof course.description === "string"
              ? course.description.replace(/<[^>]*>/g, "").slice(0, 100)
              : ""}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold">{subjectCount} Subjects</span>
          </div>
          {subscription.startdate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold">
                {new Date(subscription.startdate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Start Button */}
        {showStartButton && (
          <button
            onClick={handleStart}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 hover:shadow-lg transition-all group-hover:scale-[1.02]"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Learning
          </button>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default CourseCard;
