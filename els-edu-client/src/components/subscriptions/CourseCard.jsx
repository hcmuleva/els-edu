import React from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Play,
  Sparkles,
} from "lucide-react";

const CATEGORY_STYLES = {
  KIDS: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
  PRIMARY: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  MIDDLE: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-200",
  },
  SCHOOL: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
  },
  COLLEGE: {
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    border: "border-cyan-200",
  },
  SANSKAR: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  EDUCATION: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
};

const TYPE_STYLES = {
  FREE: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  FREEMIUM: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-200",
  },
  PAID: {
    bg: "bg-primary-50",
    text: "text-primary-600",
    border: "border-primary-200",
  },
  TRIAL: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-200",
  },
};

/**
 * CourseCard - Displays a subscribed course with minimal, playful design
 */
const CourseCard = ({ subscription, showStartButton = true }) => {
  const navigate = useNavigate();
  const course = subscription?.course;

  if (!course) return null;

  const subjectCount =
    subscription?.subjects?.length || course?.subjects?.length || 0;

  const categoryStyle = CATEGORY_STYLES[course.category] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  };

  const typeStyle =
    TYPE_STYLES[subscription.subscription_type] || TYPE_STYLES.FREE;

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
      className="group relative bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Cover Image */}
      <div className="relative h-36 bg-gradient-to-br from-primary-50 via-violet-50 to-pink-50 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={course.name}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Category Badge - Top Left */}
        {course.category && (
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border} backdrop-blur-sm`}
            >
              {course.category}
            </span>
          </div>
        )}

        {/* Subscription Type Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border} backdrop-blur-sm`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {subscription.subscription_type || "FREE"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">
          {course.name}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {typeof course.description === "string"
              ? course.description.replace(/<[^>]*>/g, "").slice(0, 80)
              : "Continue your learning journey..."}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="font-medium">{subjectCount} subjects</span>
          </div>
          {subscription.startdate && (
            <>
              <div className="w-1 h-1 rounded-full bg-gray-200" />
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {new Date(subscription.startdate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Start Button */}
        {showStartButton && (
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-violet-500 hover:from-primary-600 hover:to-violet-600 transition-all shadow-sm group-hover:scale-[1.02]"
          >
            <Play className="w-4 h-4" />
            Start Learning
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
