import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Layers,
  Play,
  Sparkles,
  Eye,
  RefreshCw,
} from "lucide-react";
import { subscriptionService } from "../../services/subscriptionService";

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
 * Includes refresh button for syncing subscription with course updates
 */
const CourseCard = ({
  subscription,
  showStartButton = true,
  onRefresh,
  counts,
}) => {
  const navigate = useNavigate();
  const course = subscription?.course;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(null);

  if (!course) return null;

  // Use counts from API if available, fallback to calculating from data
  const subjectCount =
    counts?.subjectCount ?? subscription?.subjects?.length ?? 0;
  const topicCount = counts?.topicCount ?? 0;
  const quizCount = counts?.quizCount ?? 0;

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
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/my-subscriptions/${course.documentId}`);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/browse-courses/${course.documentId}`);
  };

  const handleCardClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/my-subscriptions/${course.documentId}`);
  };

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    setRefreshMessage(null);

    try {
      const result = await subscriptionService.refreshSubscription(
        subscription.documentId
      );

      if (result?.data?.hasChanges) {
        const { added, removed } = result.data.changes || {};
        const msgs = [];
        if (added?.length) msgs.push(`${added.length} new subject(s) added`);
        if (removed?.length) msgs.push(`${removed.length} subject(s) removed`);
        setRefreshMessage(msgs.join(", ") || "Updated!");
      } else {
        setRefreshMessage("Already in sync");
      }

      // Callback to parent to refetch subscriptions list
      onRefresh?.();

      // Clear message after 3 seconds
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (error) {
      console.error("Refresh failed:", error);
      setRefreshMessage("Refresh failed");
      setTimeout(() => setRefreshMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full"
    >
      {/* Cover Image */}
      <div className="relative h-40 md:h-48 bg-gradient-to-br from-primary-50 via-violet-50 to-pink-50 overflow-hidden shrink-0">
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

        {/* Refresh Button - Top Left */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="absolute top-3 left-3 p-2 rounded-lg bg-white/90 hover:bg-white shadow-sm transition-all disabled:opacity-50"
          title="Sync with latest course updates"
        >
          <RefreshCw
            className={`w-4 h-4 text-gray-600 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>

        {/* Refresh Message Toast */}
        {refreshMessage && (
          <div className="absolute top-14 left-3 px-3 py-1.5 rounded-lg bg-gray-900/80 text-white text-xs font-medium animate-fade-in">
            {refreshMessage}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
          {course.name}
        </h3>

        {/* Description */}
        {course.description ? (
          <p className="text-sm text-gray-500 mb-3 line-clamp-1">
            {typeof course.description === "string"
              ? course.description.replace(/<[^>]*>/g, "").slice(0, 100)
              : "Continue your learning journey..."}
          </p>
        ) : (
          <div className="mb-3 h-5"></div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4 flex-wrap mt-auto">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">{subjectCount} subjects</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span className="font-medium">{topicCount} topics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" />
            <span className="font-medium">{quizCount} quizzes</span>
          </div>
        </div>

        {/* Action Buttons */}
        {showStartButton && (
          <div className="flex gap-3 mt-auto">
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
