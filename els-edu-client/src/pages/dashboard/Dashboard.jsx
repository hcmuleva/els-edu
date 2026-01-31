import React, { useState, useEffect } from "react";
import { Title, useGetIdentity, useDataProvider } from "react-admin";
import { useNavigate } from "react-router-dom";
import { BookOpen, Trophy, Sparkles, GraduationCap, Zap } from "lucide-react";
import ClassroomDashboardSection from "../../components/dashboard/ClassroomDashboardSection";
import TeacherDashboardSection from "../../components/dashboard/TeacherDashboardSection";
import ParentDashboardSection from "../../components/dashboard/ParentDashboardSection";
import StudentDashboardSection from "../../components/dashboard/StudentDashboardSection";
import { useRoleNavigation } from "../../hooks/useRoleNavigation";

const Dashboard = () => {
  const { identity, isLoading: identityLoading } = useGetIdentity();
  const navigate = useNavigate();
  const { canAccess, userRole: currentRole } = useRoleNavigation();

  // Check if user can browse courses (only for default org users)
  const canBrowseCourses = canAccess("browse-courses");

  if (identityLoading) {
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

  // --- Role Based Rendering ---

  // 1. Teacher View
  if (currentRole === "TEACHER" || currentRole === "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50/50 pb-20 md:pb-8 overflow-x-hidden">
        <Title title="Teacher Dashboard" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Teacher Dashboard
            </h1>
            <p className="text-gray-500">Manage your classes and students</p>
          </div>
          <TeacherDashboardSection />
        </div>
      </div>
    );
  }

  // 2. Parent View
  if (currentRole === "PARENT") {
    return (
      <div className="min-h-screen bg-gray-50/50 pb-20 md:pb-8 overflow-x-hidden">
        <Title title="Parent Dashboard" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Parent Dashboard
            </h1>
            <p className="text-gray-500">Track your child's progress</p>
          </div>
          <ParentDashboardSection />
        </div>
      </div>
    );
  }

  // 3. Student View (Default)
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20 pb-20 md:pb-0 overflow-x-hidden">
      <Title title="Dashboard" />

      {/* Full-Width Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 w-full">
        <div className="w-full px-4 py-4 md:px-8 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-200 shrink-0">
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  Welcome back, {identity?.fullName || identity?.username}! 👋
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Keep learning and growing every day!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full py-4 md:py-8">
        {/* Student Analytics & Stats with Classroom Section integrated */}
        <StudentDashboardSection identity={identity}>
          <ClassroomDashboardSection />
        </StudentDashboardSection>

        {/* Quick Actions */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-500" />
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {canBrowseCourses && (
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
            )}

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
      </div>
    </div>
  );
};

export default Dashboard;
