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
import SurveyCompletionCard from "./SurveyCompletionCard";
import analyticsService from "../../services/analyticsService";

const StudentDashboardSection = ({ identity, children }) => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    stats: {
      totalQuizzes: 0,
      averageScore: 0,
      activeCourses: 0,
      completedCourses: 0,
    },
    charts: {
      skillRadar: [],
      progressHistory: [],
      activityHeatmap: [],
    },
    insights: {
      recommendations: [],
    },
  });

  // Fetch analytics on mount
  useEffect(() => {
    // Mock data for initial render or fallback
    const mockData = analyticsService.getMockAnalytics(identity?.grade);
    setData(mockData);

    // Then try to fetch real data
    const loadRealData = async () => {
      try {
        if (identity?.grade) {
          // In a real app, this would be an API call
          // const realData = await analyticsService.getStudentAnalytics(identity.id);
          // setData(realData);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      }
    };

    loadRealData();
  }, [identity]);

  // Helper for gap badge
  const getGapBadge = (gap) => {
    if (gap <= 0)
      return (
        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
          On Track
        </span>
      );
    if (gap === 1)
      return (
        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
          Minor Gap
        </span>
      );
    return (
      <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
        Needs Focus
      </span>
    );
  };

  const getGapIcon = (gap) => {
    if (gap <= 0) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (gap === 1) return <Minus className="w-4 h-4 text-yellow-500" />;
    return <ArrowRight className="w-4 h-4 text-red-500" />;
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
    <div className="space-y-6">
      {/* Survey Completion Card - Show for first-time users */}
      {!identity?.is_survey_completed && (
        <SurveyCompletionCard
          userGrade={identity?.grade}
          userName={identity?.username}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Main Area */}
        <div className="lg:col-span-7 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Integrated Classroom Content */}
          {children}

          {/* Skill Gap Analysis Table */}
          {skillGapData.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Skill Gap Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Skill</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3">Gap</th>
                      <th className="px-4 py-3 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {skillGapData.slice(0, 5).map((skill, i) => (
                      <tr key={i} className="group hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                          {skill.skill}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((l) => (
                              <div
                                key={l}
                                className={`w-1.5 h-6 rounded-sm ${
                                  l <= skill.actualLevel
                                    ? "bg-primary-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-500">
                          {skill.gap > 0 ? `-${skill.gap}` : "0"}
                        </td>
                        <td className="px-4 py-3">{getGapBadge(skill.gap)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                      awarenessPercentage >= 80
                        ? "bg-green-100 text-green-700"
                        : awarenessPercentage >= 50
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {awarenessPercentage >= 80
                      ? "Keep it up!"
                      : "Needs Attention"}
                  </span>
                  <p className="text-sm text-gray-600 leading-snug">
                    {awarenessPercentage >= 80
                      ? "Great job! Your self-assessment closely matches your actual skills."
                      : "Consider reflecting more on your skill levels for accurate self-assessment."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.insights?.recommendations?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Recommended For You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.insights.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(rec.link)}
                  >
                    <div className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">
                      {rec.type}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      {rec.title}
                    </h3>
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

        {/* Right Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Consistency */}
          {data.charts?.activityHeatmap && (
            <div>
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

          {/* Learning Progress */}
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

          {/* Strong & Weak Areas */}
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
      </div>
    </div>
  );
};

export default StudentDashboardSection;
