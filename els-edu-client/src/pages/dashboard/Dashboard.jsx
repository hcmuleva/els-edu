import React, { useState, useEffect } from "react";
import { Title, useGetIdentity, useDataProvider } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Trophy,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Target,
  X,
  CheckCircle2,
  Zap,
  User,
  Edit3,
} from "lucide-react";

const Dashboard = () => {
  const { identity, isLoading: identityLoading } = useGetIdentity();
  const dataProvider = useDataProvider();
  const navigate = useNavigate();

  const [showTour, setShowTour] = useState(false);
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    totalQuizAttempts: 0,
    averageScore: 0,
    passedQuizzes: 0,
  });
  const [loading, setLoading] = useState(true);

  // Check if user has seen the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenDashboardTour");
    if (!hasSeenTour && identity) {
      setShowTour(true);
    }
  }, [identity]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!identity?.id) return;

      try {
        setLoading(true);

        // Fetch subscriptions
        const { data: subs } = await dataProvider.getList("usersubscriptions", {
          filter: { user: identity.id },
          pagination: { page: 1, perPage: 1000 },
        });

        // Fetch quiz results
        const { data: results } = await dataProvider.getList("quiz-results", {
          filter: { user: identity.id },
          pagination: { page: 1, perPage: 1000 },
        });

        const averageScore =
          results.length > 0
            ? Math.round(
                results.reduce((sum, r) => sum + r.percentage, 0) /
                  results.length
              )
            : 0;

        const passed = results.filter((r) => r.isPassed).length;

        setStats({
          totalSubscriptions: subs.length || 0,
          totalQuizAttempts: results.length || 0,
          averageScore,
          passedQuizzes: passed,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [identity, dataProvider]);

  const handleDismissTour = () => {
    localStorage.setItem("hasSeenDashboardTour", "true");
    setShowTour(false);
  };

  if (identityLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const isNewUser =
    stats.totalSubscriptions === 0 && stats.totalQuizAttempts === 0;
  const isProfileIncomplete =
    !identity?.fullName || !identity?.email || !identity?.age;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20 pb-20 md:pb-0">
      <Title title="Dashboard" />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 pt-safe">
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-200 shrink-0">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">
                Welcome back, {identity?.fullName || identity?.username}! 👋
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Here's your learning progress at a glance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-8 space-y-6">
        {/* Tour Guide Modal */}
        {showTour && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto hide-scrollbar">
              {/* ... (Modal content remains mostly same, just ensuring responsiveness) ... */}
              <button
                onClick={handleDismissTour}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>

              <div className="text-center mb-6 mt-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
                  <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Welcome, Learner! 🎉
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  Let's get you started in just 3 simple steps
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {[
                  {
                    step: 1,
                    icon: BookOpen,
                    title: "Browse Courses",
                    description:
                      "Explore our wide range of courses tailored for you",
                    action: "/browse-courses",
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    step: 2,
                    icon: CheckCircle2,
                    title: "Enroll in Courses",
                    description: "Subscribe to any course that interests you",
                    action: "/my-subscriptions",
                    color: "from-emerald-500 to-teal-500",
                  },
                  {
                    step: 3,
                    icon: Zap,
                    title: "Start Learning",
                    description:
                      "Access subjects, topics, and quizzes to begin your journey",
                    action: "/my-subscriptions",
                    color: "from-violet-500 to-purple-500",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="flex items-start gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all cursor-pointer bg-gray-50/50"
                      onClick={() => {
                        handleDismissTour();
                        navigate(item.action);
                      }}
                    >
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-md`}
                      >
                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            STEP {item.step}
                          </span>
                        </div>
                        <h3 className="text-sm md:text-base font-bold text-gray-900 mb-0.5 truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0 self-center" />
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleDismissTour}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-primary-500 to-violet-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-violet-600 transition-all shadow-md active:scale-95"
              >
                Got it, Let's Start!
              </button>
            </div>
          </div>
        )}

        {/* Getting Started Card - Mobile Optimized */}
        {isNewUser && !showTour && (
          <div className="bg-gradient-to-br from-primary-500 to-violet-600 rounded-3xl p-6 md:p-8 text-white shadow-xl md:shadow-2xl shadow-primary-200/50">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold mb-2">
                  Ready to Start Learning?
                </h3>
                <p className="text-white/90 text-sm md:text-base mb-6 leading-relaxed">
                  Discover amazing courses, enroll, and begin your educational
                  journey today!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate("/browse-courses")}
                    className="w-full sm:w-auto px-5 py-3 bg-white text-primary-600 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                  >
                    <BookOpen className="w-4 h-4" />
                    Browse Courses
                  </button>
                  <button
                    onClick={() => setShowTour(true)}
                    className="w-full sm:w-auto px-5 py-3 bg-white/10 backdrop-blur text-white border border-white/30 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    Show Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Setup Card */}
        {isProfileIncomplete && (
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-orange-200/50">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold mb-2">
                  Complete Your Profile
                </h3>
                <p className="text-white/90 text-sm md:text-base mb-6 leading-relaxed">
                  Add your details to personalize your learning experience and
                  unlock all features!
                </p>
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full md:w-auto px-6 py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <Edit3 className="w-4 h-4" />
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid - 2x2 on mobile with cleaner styling */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 md:hidden">
            Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Subscriptions */}
            <button
              onClick={() => navigate("/my-subscriptions")}
              className="bg-white rounded-2xl md:rounded-xl p-4 md:p-5 border border-gray-100/50 shadow-sm md:border-gray-100 hover:shadow-md transition-all text-center group active:scale-95"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full md:rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-gray-900 mb-0.5 md:mb-1">
                {stats.totalSubscriptions}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wide">
                Courses
              </p>
            </button>

            {/* Quiz Attempts */}
            <button
              onClick={() => navigate("/progress")}
              className="bg-white rounded-2xl md:rounded-xl p-4 md:p-5 border border-gray-100/50 shadow-sm md:border-gray-100 hover:shadow-md transition-all text-center group active:scale-95"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full md:rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5 md:w-6 md:h-6 text-violet-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-gray-900 mb-0.5 md:mb-1">
                {stats.totalQuizAttempts}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wide">
                Quizzes
              </p>
            </button>

            {/* Average Score */}
            <button
              onClick={() => navigate("/progress")}
              className="bg-white rounded-2xl md:rounded-xl p-4 md:p-5 border border-gray-100/50 shadow-sm md:border-gray-100 hover:shadow-md transition-all text-center group active:scale-95"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full md:rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-emerald-600 mb-0.5 md:mb-1">
                {stats.averageScore}%
              </p>
              <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wide">
                Avg Score
              </p>
            </button>

            {/* Passed */}
            <button
              onClick={() => navigate("/progress")}
              className="bg-white rounded-2xl md:rounded-xl p-4 md:p-5 border border-gray-100/50 shadow-sm md:border-gray-100 hover:shadow-md transition-all text-center group active:scale-95"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full md:rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-gray-900 mb-0.5 md:mb-1">
                {stats.passedQuizzes}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wide">
                Passed
              </p>
            </button>
          </div>
        </div>

        {/* Quick Actions - Horizontal Scroll on Mobile */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1 md:px-0">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-500" />
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <button
              onClick={() => navigate("/browse-courses")}
              className="w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-primary-300 hover:shadow-md transition-all text-left group active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                    Browse Courses
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Explore available courses
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/my-subscriptions")}
              className="w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-left group active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                    My Subscriptions
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Access enrolled courses
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/progress")}
              className="w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-violet-300 hover:shadow-md transition-all text-left group active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
                    View Progress
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Track your performance
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Show Tour Again Button */}
        {!isNewUser && !showTour && (
          <button
            onClick={() => setShowTour(true)}
            className="w-full md:w-auto px-5 py-3 md:py-2.5 bg-gray-50 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all border border-gray-200 flex items-center justify-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Show Guide
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
