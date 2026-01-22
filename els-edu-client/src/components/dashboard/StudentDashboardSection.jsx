import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Activity,
  Target,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Minus,
  BarChart3,
} from "lucide-react";
import { ProgressChart } from "../analytics/ProgressChart";
import { SkillRadar } from "../analytics/SkillRadar";
import { ActivityHeatmap } from "../analytics/ActivityHeatmap";
import { StatCard } from "../analytics/StatCard";
import analyticsService from "../../services/analyticsService";

const StudentDashboardSection = ({ identity }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await analyticsService.getStudentDashboard();
        setData(response.data);
      } catch (error) {
        console.error("Error fetching student analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) return null;

  // Helper for gap badge
  const getGapBadge = (gap) => {
    if (gap === undefined || gap === null)
      return <span className="text-gray-400">-</span>;
    if (gap <= 0)
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
          On Track
        </span>
      );
    if (gap === 1)
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
          Minor Gap
        </span>
      );
    return (
      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
        Needs Work
      </span>
    );
  };

  const getGapIcon = (gap) => {
    if (gap === undefined || gap === null)
      return <Minus className="w-4 h-4 text-gray-400" />;
    if (gap <= 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  // Calculate skill gap data from skillRadar
  const skillGapData =
    data.charts?.skillRadar?.map((skill) => ({
      skill: skill.skill,
      requiredLevel: 4, // Mock: assume required level is 4
      actualLevel: Math.ceil(skill.score / 20), // Convert 0-100 to 1-5
      selfRating: Math.ceil(skill.score / 20) + (Math.random() > 0.5 ? 1 : 0), // Mock self-rating
      gap: 4 - Math.ceil(skill.score / 20),
    })) || [];

  // Self-awareness score
  const selfAwarenessScore =
    skillGapData.length > 0
      ? skillGapData.reduce((sum, s) => {
          const diff = Math.abs((s.selfRating || 0) - (s.actualLevel || 0));
          return sum + (5 - diff);
        }, 0) / skillGapData.length
      : 0;
  const awarenessPercentage = (selfAwarenessScore / 5) * 100;

  return (
    <div className="space-y-8">
      {/* Activity Heatmap */}
      {data.charts?.activityHeatmap && (
        <div className="px-1 md:px-0">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Daily Consistency
            </h2>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <ActivityHeatmap data={data.charts.activityHeatmap} />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-1 md:px-0">
        <StatCard
          title="Total Quizzes"
          value={data.stats.totalQuizzes}
          icon={Trophy}
          color="violet"
        />
        <StatCard
          title="Avg Score"
          value={`${data.stats.averageScore}%`}
          icon={Target}
          color="emerald"
        />
        <StatCard
          title="Courses Active"
          value={data.stats.activeCourses}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={data.stats.completedCourses}
          icon={CheckCircle2}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1 md:px-0">
        {/* Progress Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-500" />
              Learning Progress
            </h3>
          </div>
          {data.charts?.progressHistory?.length > 0 ? (
            <ProgressChart data={data.charts.progressHistory} />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              Not enough data yet
            </div>
          )}
        </div>

        {/* Skill Radar */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-pink-500" />
              Strong & Weak Areas
            </h3>
          </div>
          {data.charts?.skillRadar?.length > 0 ? (
            <SkillRadar data={data.charts.skillRadar} />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              Take more quizzes to see skills
            </div>
          )}
        </div>
      </div>

      {/* Skill Gap Analysis Table */}
      {skillGapData.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm px-1 md:px-0">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Skill Gap Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Skill</th>
                  <th className="pb-3 font-medium text-center">Required</th>
                  <th className="pb-3 font-medium text-center">Self Rating</th>
                  <th className="pb-3 font-medium text-center">Actual</th>
                  <th className="pb-3 font-medium text-center">Gap</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {skillGapData.map((skill, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-gray-800">
                      {skill.skill}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                        L{skill.requiredLevel}
                      </span>
                    </td>
                    <td className="py-3 text-center text-gray-500">
                      {skill.selfRating}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                        L{skill.actualLevel}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div
                        className={`flex items-center justify-center gap-1 font-bold ${
                          skill.gap <= 0
                            ? "text-green-600"
                            : skill.gap === 1
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {getGapIcon(skill.gap)}
                        {skill.gap > 0
                          ? `-${skill.gap}`
                          : skill.gap === 0
                          ? "0"
                          : `+${Math.abs(skill.gap)}`}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      {getGapBadge(skill.gap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Level Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Skill Level Mapping
            </p>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <p className="font-bold text-gray-800">L1</p>
                <p className="text-gray-500">&lt;40%</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <p className="font-bold text-gray-800">L2</p>
                <p className="text-gray-500">40-59%</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <p className="font-bold text-gray-800">L3</p>
                <p className="text-gray-500">60-74%</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <p className="font-bold text-gray-800">L4</p>
                <p className="text-gray-500">75-89%</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <p className="font-bold text-gray-800">L5</p>
                <p className="text-gray-500">90-100%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Self-Awareness Score */}
      {skillGapData.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Self-Awareness Score</h3>
          <div className="flex items-center gap-6">
            <div className="relative h-28 w-28">
              <svg className="h-28 w-28 -rotate-90 transform">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke={
                    awarenessPercentage >= 80
                      ? "#10b981"
                      : awarenessPercentage >= 50
                      ? "#f59e0b"
                      : "#ef4444"
                  }
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${awarenessPercentage * 3.02} 302`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">
                  {Math.round(awarenessPercentage)}%
                </span>
              </div>
            </div>
            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  awarenessPercentage >= 80
                    ? "bg-green-100 text-green-700"
                    : awarenessPercentage >= 50
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {awarenessPercentage >= 80
                  ? "High Awareness"
                  : awarenessPercentage >= 50
                  ? "Medium Awareness"
                  : "Low Awareness"}
              </span>
              <p className="mt-2 text-sm text-gray-500 max-w-xs">
                {awarenessPercentage >= 80
                  ? "Excellent! Your self-assessment closely matches your actual skill levels."
                  : awarenessPercentage >= 50
                  ? "Good job! There is some room for improvement in self-assessment accuracy."
                  : "Consider reflecting more on your skill levels for accurate self-assessment."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.insights?.recommendations?.length > 0 && (
        <div className="px-1 md:px-0">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Recommended For You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.insights.recommendations.map((rec, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(rec.link)}
              >
                <div className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">
                  {rec.type}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{rec.title}</h3>
                <p className="text-sm text-gray-500">{rec.reason}</p>
                <div className="mt-3 text-primary-600 text-sm font-semibold flex items-center gap-1 group">
                  Start Learning{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboardSection;
