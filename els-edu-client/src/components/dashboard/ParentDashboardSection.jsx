import React, { useEffect, useState } from "react";
import analyticsService from "../../services/analyticsService";
import { StatCard } from "../analytics/StatCard";
import { ActivityHeatmap } from "../analytics/ActivityHeatmap";
import { ProgressChart } from "../analytics/ProgressChart";
import { SkillRadar } from "../analytics/SkillRadar";
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  User,
  Plus,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  MessageSquare,
  Target,
  X,
  Trophy,
  Clock,
  ChevronRight,
  FileText,
} from "lucide-react";

const ParentDashboardSection = () => {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview | quizzes | subjects

  // Link Child Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkChildId, setLinkChildId] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsService.getParentDashboard();
        const childrenList = res.data.children || [];
        setChildren(childrenList);
        if (childrenList.length > 0) {
          setSelectedChildId(childrenList[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLinkChild = async () => {
    if (!linkChildId) return;
    setLinkLoading(true);
    setLinkError("");
    setLinkSuccess("");

    try {
      await analyticsService.linkChild(linkChildId);
      setLinkSuccess("Child linked successfully!");
      setLinkChildId("");
      const res = await analyticsService.getParentDashboard();
      setChildren(res.data.children || []);
      setTimeout(() => {
        setIsLinkModalOpen(false);
        setLinkSuccess("");
      }, 2000);
    } catch (err) {
      setLinkError(err.response?.data?.error || "Failed to link child.");
    } finally {
      setLinkLoading(false);
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // Mock data for features not yet in backend
  const mockRemarks = [
    {
      teacher: "Mrs. Sharma",
      subject: "Math",
      remark: "Good progress!",
      date: "Jan 20",
    },
    {
      teacher: "Mr. Patel",
      subject: "Science",
      remark: "Needs more focus",
      date: "Jan 18",
    },
  ];

  const mockAttendance = { present: 18, total: 20, attendedToday: true };

  // Mock quiz history from child data
  const quizHistory = selectedChild?.quizHistory || [
    {
      id: 1,
      title: "Mathematics Quiz",
      score: 85,
      date: "Jan 20",
      status: "passed",
    },
    {
      id: 2,
      title: "Science Test",
      score: 72,
      date: "Jan 18",
      status: "passed",
    },
    {
      id: 3,
      title: "English Grammar",
      score: 58,
      date: "Jan 15",
      status: "failed",
    },
    {
      id: 4,
      title: "General Knowledge",
      score: 90,
      date: "Jan 12",
      status: "passed",
    },
  ];

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading your dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {children.length > 0 ? (
          <>
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedChildId === child.id
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-primary-300"
                }`}
              >
                {child.name}
              </button>
            ))}
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full p-8 text-center bg-white rounded-2xl border border-gray-100">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">
              No Children Linked
            </h3>
            <p className="text-gray-500 mt-1 mb-4">
              Link your child's account to view their progress.
            </p>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700"
            >
              Link Child Account
            </button>
          </div>
        )}
      </div>

      {selectedChild && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-primary-500 via-violet-500 to-purple-500 p-6 rounded-2xl text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedChild.name}'s Progress
                </h2>
                <p className="text-white/80 text-sm mt-1">Last active: Today</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <p className="text-2xl font-bold">
                    {selectedChild.stats.averageScore}%
                  </p>
                  <p className="text-xs text-white/70">Avg Score</p>
                </div>
                <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <p className="text-2xl font-bold">
                    {selectedChild.stats.totalQuizzes}
                  </p>
                  <p className="text-xs text-white/70">Quizzes</p>
                </div>
                <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <p className="text-2xl font-bold">
                    {mockAttendance.present}/{mockAttendance.total}
                  </p>
                  <p className="text-xs text-white/70">Attendance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
            {[
              { id: "overview", label: "Overview" },
              { id: "quizzes", label: "Quiz Results" },
              { id: "subjects", label: "Subjects" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Stats & Heatmap */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    title="Quizzes"
                    value={selectedChild.stats.totalQuizzes}
                    icon={Trophy}
                    color="violet"
                  />
                  <StatCard
                    title="Avg Score"
                    value={`${selectedChild.stats.averageScore}%`}
                    icon={Target}
                    color={
                      selectedChild.stats.averageScore >= 70
                        ? "emerald"
                        : "orange"
                    }
                  />
                  <StatCard
                    title="Attendance"
                    value={`${Math.round(
                      (mockAttendance.present / mockAttendance.total) * 100,
                    )}%`}
                    icon={Calendar}
                    color={mockAttendance.attendedToday ? "emerald" : "rose"}
                  />
                  <StatCard
                    title="Completed"
                    value={selectedChild.stats.completedCourses}
                    icon={CheckCircle2}
                    color="blue"
                  />
                </div>

                {/* Activity Heatmap - Compact */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-gray-800">
                      Activity Streak
                    </h3>
                  </div>
                  {selectedChild.charts?.activityHeatmap && (
                    <ActivityHeatmap
                      data={selectedChild.charts.activityHeatmap}
                      compact
                    />
                  )}
                </div>

                {/* Progress Chart */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    Score Trend (Last 30 Days)
                  </h3>
                  {selectedChild.charts?.progressHistory?.length > 0 ? (
                    <div className="h-[180px]">
                      <ProgressChart
                        data={selectedChild.charts.progressHistory}
                      />
                    </div>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
                      Not enough data yet
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Insights */}
              <div className="space-y-6">
                {/* Strong/Weak Areas */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-sm mb-4">
                    Performance Summary
                  </h3>

                  {selectedChild.insights?.strongAreas?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        Strong Areas
                      </p>
                      <div className="space-y-2">
                        {selectedChild.insights.strongAreas
                          .slice(0, 2)
                          .map((area, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {area.skill}
                              </span>
                              <span className="text-sm font-bold text-emerald-600">
                                {area.score}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {selectedChild.insights?.weakAreas?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        Needs Focus
                      </p>
                      <div className="space-y-2">
                        {selectedChild.insights.weakAreas
                          .slice(0, 2)
                          .map((area, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-2 bg-orange-50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {area.skill}
                              </span>
                              <span className="text-sm font-bold text-orange-600">
                                {area.score}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Teacher Remarks */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Teacher Remarks
                  </h3>
                  <div className="space-y-3">
                    {mockRemarks.map((r, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-gray-800">
                            {r.teacher}
                          </span>
                          <span className="text-xs text-gray-400">
                            {r.date}
                          </span>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">
                          {r.subject}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{r.remark}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quiz Results Tab */}
          {activeTab === "quizzes" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-500" />
                  Quiz History
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {quizHistory.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            quiz.score >= 60 ? "bg-emerald-100" : "bg-red-100"
                          }`}
                        >
                          <span
                            className={`text-lg font-bold ${
                              quiz.score >= 60
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {quiz.score}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {quiz.title}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {quiz.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            quiz.status === "passed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {quiz.status === "passed" ? "Passed" : "Needs Review"}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects Tab */}
          {activeTab === "subjects" && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Subject-wise Performance
              </h3>
              {selectedChild.charts?.skillRadar?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-[300px]">
                    <SkillRadar data={selectedChild.charts.skillRadar} />
                  </div>
                  <div className="space-y-3">
                    {selectedChild.charts.skillRadar.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-28 text-sm font-medium text-gray-700">
                          {skill.skill}
                        </div>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              skill.score >= 80
                                ? "bg-emerald-500"
                                : skill.score >= 60
                                ? "bg-blue-500"
                                : skill.score >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${skill.score}%` }}
                          />
                        </div>
                        <div className="w-12 text-right text-sm font-bold text-gray-800">
                          {skill.score}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  No subject data available yet
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Child Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Link Child Account
              </h3>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child's Document ID
                </label>
                <input
                  type="text"
                  value={linkChildId}
                  onChange={(e) => setLinkChildId(e.target.value)}
                  placeholder="Enter User Document ID"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
              </div>
              {linkError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {linkError}
                </div>
              )}
              {linkSuccess && (
                <div className="p-3 bg-green-50 text-green-600 text-sm rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {linkSuccess}
                </div>
              )}
              <button
                onClick={handleLinkChild}
                disabled={linkLoading || !linkChildId}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50"
              >
                {linkLoading ? "Linking..." : "Link Child"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboardSection;
