import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Layers, Users, GraduationCap } from "lucide-react";

const CATEGORY_COLORS = {
  KIDS: "bg-pink-100 text-pink-700",
  PRIMARY: "bg-blue-100 text-blue-700",
  MIDDLE: "bg-purple-100 text-purple-700",
  SCHOOL: "bg-indigo-100 text-indigo-700",
  COLLEGE: "bg-cyan-100 text-cyan-700",
  OLDAGE: "bg-amber-100 text-amber-700",
  SANSKAR: "bg-orange-100 text-orange-700",
  COMPETION: "bg-red-100 text-red-700",
  PROJECT: "bg-green-100 text-green-700",
  DIY: "bg-lime-100 text-lime-700",
  EDUCATION: "bg-teal-100 text-teal-700",
};

const SUBSCRIPTION_BADGES = {
  FREE: { bg: "bg-green-100", text: "text-green-700", label: "FREE" },
  FREEMIUM: { bg: "bg-yellow-100", text: "text-yellow-700", label: "TRY FREE" },
  PAID: { bg: "bg-primary/10", text: "text-primary", label: "PAID" },
};

/**
 * BrowseCourseCard - Displays a course in the browse catalog
 *
 * Props:
 * - course: Course object with subjects populated
 * - subscriptionType: FREE | FREEMIUM | PAID (default: FREE)
 * - isEnrolled: Whether user is already enrolled
 * - onEnroll: Callback when enroll button clicked
 * - onClick: Callback when card clicked (for details drawer)
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

  // Calculate total topics across all subjects
  const topicCount = (course?.subjects || []).reduce((total, subject) => {
    return total + (subject?.topics?.length || 0);
  }, 0);

  // Determine pricing type - FREE if no pricing or amount is 0
  const isFree =
    !coursePricing ||
    (coursePricing.final_amount || coursePricing.base_amount || 0) === 0;
  const subscriptionType = isFree ? "FREE" : "PAID";
  const priceAmount =
    coursePricing?.final_amount || coursePricing?.base_amount || 0;
  const currency = coursePricing?.currency || "INR";
  const pricingType = coursePricing?.pricing_type || "COURSE_BUNDLE";
  const hasSubjectPricing = (coursePricing?.subject_pricings?.length || 0) > 0;

  const categoryColor =
    CATEGORY_COLORS[course?.category] || "bg-gray-100 text-gray-700";
  const badge =
    SUBSCRIPTION_BADGES[subscriptionType] || SUBSCRIPTION_BADGES.FREE;

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    navigate(`/browse-courses/${course.documentId}`);
  };

  const handleEnrollClick = (e) => {
    e.stopPropagation();
    if (onEnroll) onEnroll(course);
  };

  // Pending payment handling
  const isPending = !!pendingPayment;

  const handleResumeClick = (e) => {
    e.stopPropagation();
    console.log("REF_DEBUG: Resume button clicked for", pendingPayment);
    if (onResumePayment && pendingPayment) {
      onResumePayment(pendingPayment);
    } else {
      console.warn("REF_DEBUG: onResumePayment or pendingPayment missing", {
        onResumePayment: !!onResumePayment,
        pendingPayment,
      });
    }
  };

  const handleCancelClick = (e) => {
    e.stopPropagation();
    if (onCancelPayment && pendingPayment) onCancelPayment(pendingPayment);
  };

  return (
    <div
      className={`group relative bg-white rounded-3xl border-2 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer ${
        isPending
          ? "border-orange-200 ring-2 ring-orange-100"
          : "border-gray-100"
      }`}
    >
      {/* Cover Image */}
      <div
        onClick={() => onClick && onClick(course)}
        className="relative h-40 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/20 overflow-hidden"
      >
        {course?.cover?.url ? (
          <img
            src={course.cover.url}
            alt={course.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GraduationCap className="w-16 h-16 text-primary/30" />
          </div>
        )}

        {/* Category Badge */}
        {course?.category && (
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${categoryColor} shadow-md`}
            >
              {course.category}
            </span>
          </div>
        )}

        {/* Subscription Type Badge - Hide if pending to show Pending badge instead */}
        <div className="absolute top-3 right-3">
          {isPending ? (
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-700 shadow-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              PAYMENT PENDING
            </span>
          ) : (
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${badge.bg} ${badge.text} shadow-md`}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Enrolled Badge */}
        {isEnrolled && !isPending && (
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-primary text-white shadow-md">
              ✓ ENROLLED
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-black text-gray-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {course.name}
        </h3>

        {/* Description Preview */}
        {course?.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {typeof course.description === "string"
              ? course.description.replace(/<[^>]*>/g, "").slice(0, 100)
              : "Explore this course..."}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold">{subjectCount} Subjects</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span className="font-semibold">{topicCount} Topics</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isPending ? (
            <>
              <button
                onClick={handleCancelClick}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-50 hover:bg-red-100 text-red-600 transition-colors border border-red-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResumeClick}
                className="flex-[1.5] py-2.5 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-md shadow-orange-200"
              >
                Continue Payment
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDetailsClick}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                Details
              </button>
              <button
                onClick={handleDetailsClick}
                disabled={isEnrolled}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                  isEnrolled
                    ? "bg-green-100 text-green-700 cursor-default"
                    : hasPartialEnrollment
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : subscriptionType === "FREE"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                {isEnrolled
                  ? "✓ Enrolled"
                  : hasPartialEnrollment
                  ? `${enrolledSubjectCount}/${totalSubjectCount} Enrolled`
                  : isFree
                  ? "Enroll Free"
                  : `₹${priceAmount.toLocaleString()}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseCourseCard;
