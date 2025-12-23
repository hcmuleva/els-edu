import React from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Layers,
  Play,
  Sparkles,
  Eye,
} from "lucide-react";

const TYPE_STYLES = {
  FREE: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  FREEMIUM: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
  },
  PAID: {
    bg: "bg-primary-50",
    text: "text-primary-600",
  },
  TRIAL: {
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
};

/**
 * CourseCard - Displays a subscribed course with full-width design
 */
const CourseCard = ({ subscription, showStartButton = true }) => {
  const navigate = useNavigate();
  const course = subscription?.course;

  if (!course) return null;

  const subjectCount =
    subscription?.subjects?.length || course?.subjects?.length || 0;
  const topicCount = course?.topics?.length || 0;

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

  const handleViewDetails = (e) => {
    e.stopPropagation();
    navigate(`/browse-courses/${course.documentId}`);
  };

  const handleCardClick = () => {
    navigate(`/my-subscriptions/${course.documentId}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary-50 via-violet-50 to-pink-50 overflow-hidden">
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

        {/* Type Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${typeStyle.bg} ${typeStyle.text}`}
          >
            {subscription.subscription_type || "Free"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
          {course.name}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-1">
            {typeof course.description === "string"
              ? course.description.replace(/<[^>]*>/g, "").slice(0, 100)
              : "Continue your learning journey..."}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">{subjectCount} subjects</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span className="font-medium">{topicCount} topics</span>
          </div>
        </div>

        {/* Action Buttons */}
        {showStartButton && (
          <div className="flex gap-3">
            <button
              onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-violet-500 hover:from-primary-600 hover:to-violet-600 transition-all"
            >
              <Play className="w-4 h-4" />
              Continue Learning
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
