import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Layers, Clock, Sparkles, Play, Check } from "lucide-react";

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
  OLDAGE: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  SANSKAR: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  COMPETION: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
  PROJECT: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  DIY: { bg: "bg-lime-50", text: "text-lime-600", border: "border-lime-200" },
  EDUCATION: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    border: "border-teal-200",
  },
};

/**
 * BrowseCourseCard - Minimal, playful course card for browse catalog
 */
const BrowseCourseCard = ({
  course,
  coursePricing = null,
  isEnrolled = false,
  enrolledSubjectCount = 0,
  totalSubjectCount = 0,
  pendingPayment = null,
  onEnroll,
  onResumePayment,
  onCancelPayment,
  onClick,
}) => {
  const navigate = useNavigate();
  const subjectCount = course?.subjects?.length || 0;
  const hasPartialEnrollment =
    enrolledSubjectCount > 0 && enrolledSubjectCount < totalSubjectCount;

  // Calculate total topics
  const topicCount = (course?.subjects || []).reduce((total, subject) => {
    return total + (subject?.topics?.length || 0);
  }, 0);

  // Pricing
  const isFree =
    !coursePricing ||
    (coursePricing.final_amount || coursePricing.base_amount || 0) === 0;
  const priceAmount =
    coursePricing?.final_amount || coursePricing?.base_amount || 0;

  const categoryStyle = CATEGORY_STYLES[course?.category] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  };

  const isPending = !!pendingPayment;

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    navigate(`/browse-courses/${course.documentId}`);
  };

  const handleResumeClick = (e) => {
    e.stopPropagation();
    if (onResumePayment && pendingPayment) {
      onResumePayment(pendingPayment);
    }
  };

  const handleCancelClick = (e) => {
    e.stopPropagation();
    if (onCancelPayment && pendingPayment) onCancelPayment(pendingPayment);
  };

  return (
    <div
      onClick={() => onClick && onClick(course)}
      className="group relative bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Cover Image */}
      <div className="relative h-36 bg-gradient-to-br from-primary-50 via-violet-50 to-pink-50 overflow-hidden">
        {course?.cover?.url ? (
          <img
            src={course.cover.url}
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
        {course?.category && (
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border} backdrop-blur-sm`}
            >
              {course.category}
            </span>
          </div>
        )}

        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3">
          {isPending ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pending
            </span>
          ) : isEnrolled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Check className="w-3 h-3" />
              Enrolled
            </span>
          ) : isFree ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              Free
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-600 border border-primary-200">
              ₹{priceAmount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">
          {course.name}
        </h3>

        {/* Description */}
        {course?.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {typeof course.description === "string"
              ? course.description.replace(/<[^>]*>/g, "").slice(0, 80)
              : "Explore this course..."}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="font-medium">{subjectCount} subjects</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-200" />
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-medium">{topicCount} topics</span>
          </div>
        </div>

        {/* Progress Bar for partial enrollment */}
        {hasPartialEnrollment && !isPending && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500 font-medium">Progress</span>
              <span className="text-primary-600 font-semibold">
                {enrolledSubjectCount}/{totalSubjectCount}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full transition-all duration-500"
                style={{
                  width: `${(enrolledSubjectCount / totalSubjectCount) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isPending ? (
            <>
              <button
                onClick={handleCancelClick}
                className="flex-1 py-2 px-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResumeClick}
                className="flex-[1.5] py-2 px-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
              >
                Continue Payment
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDetailsClick}
                className="flex-1 py-2 px-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center justify-center gap-1.5"
              >
                View Details
              </button>
              <button
                onClick={handleDetailsClick}
                disabled={isEnrolled}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  isEnrolled
                    ? "text-emerald-600 bg-emerald-50 border border-emerald-200 cursor-default"
                    : hasPartialEnrollment
                    ? "text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100"
                    : isFree
                    ? "text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm"
                    : "text-white bg-gradient-to-r from-primary-500 to-violet-500 hover:from-primary-600 hover:to-violet-600 shadow-sm"
                }`}
              >
                {isEnrolled ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Enrolled
                  </>
                ) : hasPartialEnrollment ? (
                  "Continue"
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    {isFree ? "Start Free" : "Enroll"}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseCourseCard;
