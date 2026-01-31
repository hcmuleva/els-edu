import React, { useState, useEffect, useMemo } from "react";
import { Title, useGetIdentity, useNotify } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  RefreshCw,
  BookOpen,
  Loader2,
  AlertCircle,
  Award,
  Target,
  CheckCircle2,
  XCircle,
  Brain,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import analyticsService from "../../services/analyticsService";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-2xl text-xs z-50">
        <p className="font-bold text-gray-900 mb-2 text-sm">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center gap-2 justify-between min-w-[120px]"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-500 font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">
                L{entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TABS = [
  { id: "overall", label: "Overall", icon: Target },
  { id: "self", label: "Self-Assessment", icon: ClipboardCheck },
  { id: "quiz", label: "Quiz Results", icon: Brain },
];

const AnalyticsResultsPage = () => {
  const { identity } = useGetIdentity();
  const navigate = useNavigate();
  const notify = useNotify();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSurveyIndex, setSelectedSurveyIndex] = useState(0);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const [surveyResults, quizResults] = await Promise.all([
        analyticsService.getSurveyResults(),
        analyticsService.getQuizResults(),
      ]);
      setData(surveyResults);
      setQuizData(quizResults);
    } catch (err) {
      setError(err.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const { surveys, isAdmin, latestRecommendations } = data || {};
  const activeSurvey = surveys?.[selectedSurveyIndex] || surveys?.[0]; // Use selected or latest
  const latestSurvey = activeSurvey; // Alias for compatibility with existing code (refs to latestSurvey will now mean active)

  // Quiz data might need to be filtered if we want to show quiz linked to that survey?
  // For now, we keep the latest quiz or maybe we should find a quiz close to the survey date?
  // The user only asked for "attempted survey", so we prioritize survey data switching.
  const latestQuiz = quizData?.quizzes?.[0];

  const [activeTab, setActiveTab] = useState("overall");

  // Chart data for self-assessment
  const radarData = useMemo(() => {
    if (!latestSurvey?.skills || !latestRecommendations?.skills) return [];
    return latestSurvey.skills.map((s) => {
      const enriched = latestRecommendations.skills.find(
        (sk) => sk.name === s.skillName,
      );
      const quizSkill = latestQuiz?.skillResults?.find(
        (q) => q.skillName === s.skillName,
      );
      return {
        skill: s.skillName,
        selfRating: s.selfRating,
        quizLevel: quizSkill?.actualLevel || 0,
        required: enriched?.requiredLevel || 3,
        fullMark: 5,
      };
    });
  }, [latestSurvey, latestRecommendations, latestQuiz]);

  // Process data for Radar Chart to avoid "straight line" issue with 2 points
  const radarChartData = useMemo(() => {
    if (radarData.length === 2) {
      // Duplicate to create a closed shape (quadrilateral) instead of a line
      return [...radarData, ...radarData];
    }
    return radarData;
  }, [radarData]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!latestSurvey?.skills || !latestRecommendations?.skills) return null;

    const skillsWithGaps = latestSurvey.skills.filter((s) => {
      const enriched = latestRecommendations.skills.find(
        (sk) => sk.name === s.skillName,
      );
      return (enriched?.requiredLevel || 3) > s.selfRating;
    });

    const avgSelfRating =
      latestSurvey.skills.reduce((sum, s) => sum + s.selfRating, 0) /
      latestSurvey.skills.length;

    // Calculate eligibility based on quiz results if available
    let eligible = false;
    let eligibleSkillCount = 0;
    if (latestQuiz?.skillResults) {
      eligibleSkillCount = latestQuiz.skillResults.filter((skill) => {
        const required =
          latestRecommendations.skills.find((s) => s.name === skill.skillName)
            ?.requiredLevel || 3;
        return skill.actualLevel >= required;
      }).length;
      eligible = eligibleSkillCount >= latestSurvey.skills.length * 0.7;
    }

    return {
      skillsWithGaps: skillsWithGaps.length,
      totalSkills: latestSurvey.skills.length,
      avgSelfRating: avgSelfRating.toFixed(1),
      eligible,
      eligibleSkillCount,
    };
  }, [latestSurvey, latestRecommendations, latestQuiz]);

  const getGapIndicator = (selfRating, requiredLevel) => {
    const gap = requiredLevel - selfRating;
    if (gap > 1)
      return {
        icon: TrendingDown,
        color: "text-red-500",
        bgColor: "bg-red-100",
        label: "Needs Work",
      };
    if (gap === 1)
      return {
        icon: TrendingDown,
        color: "text-orange-500",
        bgColor: "bg-orange-100",
        label: "Minor Gap",
      };
    if (gap === 0)
      return {
        icon: Minus,
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        label: "On Track",
      };
    return {
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-100",
      label: "Exceeds",
    };
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your analysis...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Results
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchResults}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No survey
  if (!latestSurvey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Title title="Analytics" />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Assessment Yet
          </h2>
          <p className="text-gray-600 mb-8">
            Complete a skill assessment to see your personalized
            recommendations.
          </p>
          <button
            onClick={() => navigate("/analytics/survey")}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      <Title title="Analytics" />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 -mx-4 -mt-2 md:-mx-8 md:-mt-6">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  {latestSurvey
                    ? `${latestSurvey.role} @ ${latestSurvey.company}`
                    : "Loading..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* History Selector (Admin Only) */}
              {isAdmin && surveys?.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedSurveyIndex}
                    onChange={(e) =>
                      setSelectedSurveyIndex(Number(e.target.value))
                    }
                    className="appearance-none pl-4 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  >
                    {surveys.map((survey, idx) => (
                      <option key={survey._id || idx} value={idx}>
                        {new Date(survey.createdAt).toLocaleDateString()} -{" "}
                        {survey.role}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <TrendingDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate("/analytics/survey")}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 border border-indigo-100"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden md:inline">New Assessment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto py-4">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto space-y-4">
        {/* OVERALL TAB */}
        {activeTab === "overall" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Eligibility Badge */}
            <div
              className={`p-6 rounded-2xl border-2 ${
                stats?.eligible && latestQuiz
                  ? "bg-green-50 border-green-200"
                  : latestQuiz
                  ? "bg-orange-50 border-orange-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-4">
                {stats?.eligible && latestQuiz ? (
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                ) : latestQuiz ? (
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-orange-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h2
                    className={`text-2xl font-bold ${
                      stats?.eligible && latestQuiz
                        ? "text-green-800"
                        : latestQuiz
                        ? "text-orange-800"
                        : "text-gray-600"
                    }`}
                  >
                    {stats?.eligible && latestQuiz
                      ? "ELIGIBLE"
                      : latestQuiz
                      ? "NOT YET ELIGIBLE"
                      : "QUIZ PENDING"}
                  </h2>
                  <p
                    className={`text-sm ${
                      stats?.eligible && latestQuiz
                        ? "text-green-600"
                        : latestQuiz
                        ? "text-orange-600"
                        : "text-gray-500"
                    }`}
                  >
                    {latestQuiz
                      ? `${stats?.eligibleSkillCount || 0}/${
                          stats?.totalSkills
                        } skills meet requirements`
                      : "Complete the skill quiz to see eligibility"}
                  </p>
                </div>
                {!latestQuiz && (
                  <button
                    onClick={() =>
                      navigate("/analytics/quiz", {
                        state: {
                          surveyData: {
                            company: latestSurvey.company,
                            domain: latestSurvey.domain,
                            role: latestSurvey.role,
                            skills: latestSurvey.skills,
                          },
                        },
                      })
                    }
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
                  >
                    Take Quiz
                  </button>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">
                    Self-Rating
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.avgSelfRating}
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      / 5
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">
                    Quiz Score
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestQuiz ? `${latestQuiz.overallPercentage}%` : "-"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    stats?.skillsWithGaps > 0
                      ? "bg-red-50 text-red-500"
                      : "bg-green-50 text-green-500"
                  }`}
                >
                  {stats?.skillsWithGaps > 0 ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">
                    Skill Gaps
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.skillsWithGaps}
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      skills
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">
                    Total Skills
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalSkills}
                  </p>
                </div>
              </div>
            </div>

            {/* Final Verdict - Comparison Table */}
            {latestQuiz && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Final Verdict
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Skill
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Target
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Self-Rated
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Quiz Score
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {latestSurvey.skills.map((skill) => {
                        const required =
                          latestRecommendations?.skills?.find(
                            (s) => s.name === skill.skillName,
                          )?.requiredLevel || 3;
                        const quizSkill = latestQuiz.skillResults?.find(
                          (q) => q.skillName === skill.skillName,
                        );
                        const meetsRequirement =
                          quizSkill?.actualLevel >= required;

                        return (
                          <tr
                            key={skill.skillName}
                            className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 px-3 font-medium text-gray-900">
                              {skill.skillName}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-block w-8 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                                L{required}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-block w-8 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                                L{skill.selfRating}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block w-8 py-1 text-xs font-bold rounded ${
                                  quizSkill
                                    ? meetsRequirement
                                      ? "bg-green-50 text-green-700"
                                      : "bg-red-50 text-red-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {quizSkill ? `L${quizSkill.actualLevel}` : "-"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {quizSkill ? (
                                meetsRequirement ? (
                                  <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold w-fit mx-auto">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Ready</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold w-fit mx-auto">
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Gap</span>
                                  </div>
                                )
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {quizSkill && !meetsRequirement ? (
                                <button className="text-xs text-indigo-600 font-semibold hover:underline">
                                  View Plan
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  Maintained
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recommended Topics */}
            {latestRecommendations?.topics?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-500" />
                  Recommended Topics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Deduplicate topics by documentId */}
                  {Array.from(
                    new Map(
                      latestRecommendations.topics.map((t) => [
                        t.documentId,
                        t,
                      ]),
                    ).values(),
                  )
                    .slice(0, 8)
                    .map((topic) => (
                      <div
                        key={topic.documentId}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <h4 className="font-medium text-gray-900 text-sm">
                          {topic.name}
                        </h4>
                        {topic.topic_level && (
                          <span className="text-xs text-gray-500">
                            Level {topic.topic_level}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "self" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Analysis Insight Card */}
            <div className="bg-white border-l-4 border-indigo-500 rounded-r-xl shadow-sm p-6 animate-fadeIn">
              <div className="flex gap-4">
                <div className="p-3 bg-indigo-50 rounded-full h-fit">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    AI Insights
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Based on your self-assessment, you demonstrate strong
                    alignment in{" "}
                    <strong className="text-indigo-600">
                      {radarData?.filter((d) => d.selfRating >= d.required)
                        ?.length || 0}{" "}
                      skills
                    </strong>
                    . To reach full role proficiency, focus your learning path
                    on{" "}
                    <span className="font-medium text-gray-900">
                      {radarData
                        ?.filter((d) => d.selfRating < d.required)
                        .map((d) => d.skill)
                        .join(", ") || "none"}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Radar Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Skill Gap Analysis
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Visualizing your skill shape vs. role requirements
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                      <span className="text-gray-500">Target</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-gray-900">You</span>
                    </div>
                  </div>
                </div>

                <div className="h-[350px] w-full">
                  {console.log("RadarData:", radarData)}
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={300}
                    minWidth={0}
                  >
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      data={radarData}
                    >
                      <defs>
                        <radialGradient
                          id="radarFill"
                          cx="50%"
                          cy="50%"
                          r="50%"
                          fx="50%"
                          fy="50%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#6366f1"
                            stopOpacity="0.5"
                          />
                          <stop
                            offset="100%"
                            stopColor="#6366f1"
                            stopOpacity="0.05"
                          />
                        </radialGradient>
                      </defs>
                      <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{
                          fontSize: 12,
                          fill: "#374151",
                          fontWeight: 600,
                        }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 5]}
                        tickCount={6}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Required Level"
                        dataKey="required"
                        stroke="#d1d5db"
                        strokeWidth={2}
                        fill="#f3f4f6"
                        fillOpacity={0.5}
                      />
                      <Radar
                        name="Your Rating"
                        dataKey="selfRating"
                        stroke="#6366f1"
                        strokeWidth={4}
                        fill="url(#radarFill)"
                        fillOpacity={1}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900">
                    Proficiency Levels
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Detailed breakdown of your self-reported ratings
                  </p>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={300}
                    minWidth={0}
                  >
                    <BarChart
                      data={radarData}
                      layout="vertical"
                      margin={{ left: 0, right: 20, bottom: 20 }}
                      barSize={24}
                    >
                      <defs>
                        <linearGradient
                          id="barGradient"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f3f4f6"
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis type="number" domain={[0, 5]} hide />
                      <YAxis
                        dataKey="skill"
                        type="category"
                        width={100}
                        tick={{
                          fontSize: 12,
                          fill: "#4b5563",
                          fontWeight: 500,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "#f9fafb", opacity: 0.5 }}
                      />
                      <Legend />
                      <Bar
                        dataKey="required"
                        name="Target"
                        fill="#e5e7eb"
                        radius={[0, 6, 6, 0]}
                        barSize={12}
                      />
                      <Bar
                        dataKey="selfRating"
                        fill="url(#barGradient)" // Use gradient
                        radius={[0, 6, 6, 0]}
                        name="Your Rating"
                        barSize={12}
                        background={{ fill: "#f9fafb", radius: [0, 6, 6, 0] }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom X-Axis Labels */}
                <div className="flex justify-between pl-[100px] text-xs text-gray-400 font-medium px-4">
                  <span>L0</span>
                  <span>L1</span>
                  <span>L2</span>
                  <span>L3</span>
                  <span>L4</span>
                  <span>L5</span>
                </div>
              </div>
            </div>

            {/* Skill Detail Table */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Skill Gap Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Skill
                      </th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Required
                      </th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Self-Rating
                      </th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Gap
                      </th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {latestSurvey.skills.map((skill) => {
                      const enriched = latestRecommendations?.skills?.find(
                        (s) => s.name === skill.skillName,
                      );
                      const required = enriched?.requiredLevel || 3;
                      const gap = required - skill.selfRating;
                      const indicator = getGapIndicator(
                        skill.selfRating,
                        required,
                      );
                      const GapIcon = indicator.icon;

                      return (
                        <tr
                          key={skill.skillName}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-3 font-medium text-gray-900">
                            {skill.skillName}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block w-8 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                              L{required}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block w-8 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                              L{skill.selfRating}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`flex items-center justify-center gap-1 font-bold text-xs ${indicator.color}`}
                            >
                              <GapIcon className="w-4 h-4" />
                              {gap > 0
                                ? `-${gap}`
                                : gap === 0
                                ? "0"
                                : `+${Math.abs(gap)}`}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${indicator.bgColor} ${indicator.color}`}
                            >
                              {indicator.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* QUIZ RESULTS TAB */}
        {activeTab === "quiz" && (
          <div className="space-y-4 animate-fadeIn">
            {!latestQuiz ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Quiz Completed
                </h3>
                <p className="text-gray-600 mb-6">
                  Take the skill quiz to see your actual skill levels.
                </p>
                <button
                  onClick={() =>
                    navigate("/analytics/quiz", {
                      state: {
                        surveyData: {
                          company: latestSurvey.company,
                          domain: latestSurvey.domain,
                          role: latestSurvey.role,
                          skills: latestSurvey.skills,
                        },
                      },
                    })
                  }
                  className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600"
                >
                  Start Skill Quiz
                </button>
              </div>
            ) : (
              <>
                {/* Quiz Score Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Quiz Score
                      </h3>
                      <p className="text-sm text-gray-500">
                        {latestQuiz.totalCorrect}/{latestQuiz.totalQuestions}{" "}
                        correct
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-primary-600">
                        {latestQuiz.overallPercentage}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(latestQuiz.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comparative Analysis */}
                <div className="bg-white border-l-4 border-indigo-500 rounded-r-xl shadow-sm p-6 animate-fadeIn">
                  <div className="flex gap-4">
                    <div className="p-3 bg-indigo-50 rounded-full h-fit">
                      <Target className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        Performance Analysis
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        You scored an average of{" "}
                        <strong className="text-indigo-600">
                          {latestQuiz.overallPercentage}%
                        </strong>
                        . Compared to your self-assessment, your actual skill
                        levels are{" "}
                        {latestQuiz.skillResults?.every((s) => {
                          const self = latestSurvey?.skills?.find(
                            (ss) => ss.skillName === s.skillName,
                          );
                          return s.actualLevel >= (self?.selfRating || 0);
                        }) ? (
                          <strong className="text-green-600">
                            consistently higher or matching
                          </strong>
                        ) : (
                          <strong className="text-orange-600">
                            lower in some areas
                          </strong>
                        )}
                        . Review the breakdown below to see specific gaps.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skill Breakdown Table */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Skill Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Skill
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Accuracy
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            vs Self
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Level
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {latestQuiz.skillResults?.map((skill) => {
                          const selfSkill = latestSurvey.skills.find(
                            (s) => s.skillName === skill.skillName,
                          );
                          const selfVsActual = selfSkill
                            ? skill.actualLevel - selfSkill.selfRating
                            : 0;

                          return (
                            <tr
                              key={skill.skillName}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-4 px-4 font-medium text-gray-900">
                                {skill.skillName}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="inline-block px-2 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded">
                                  {skill.correctAnswers}/
                                  {skill.questionsAttempted} ({skill.percentage}
                                  %)
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                {selfSkill && (
                                  <span
                                    className={`text-xs font-bold ${
                                      selfVsActual > 0
                                        ? "text-green-600"
                                        : selfVsActual < 0
                                        ? "text-red-600"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {selfVsActual > 0
                                      ? `+${selfVsActual}`
                                      : selfVsActual < 0
                                      ? selfVsActual
                                      : "="}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span
                                  className={`inline-block w-8 py-1 rounded text-xs font-bold ${
                                    skill.percentage >= 75
                                      ? "bg-green-100 text-green-700"
                                      : skill.percentage >= 50
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  L{skill.actualLevel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Question Analysis */}
                {latestQuiz.questionDetails?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Detailed Question Analysis
                    </h3>
                    <div className="space-y-4">
                      {latestQuiz.questionDetails.map((q, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border-l-4 ${
                            q.isCorrect
                              ? "bg-green-50 border-green-500"
                              : "bg-red-50 border-red-500"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">
                                {q.skillName}
                              </span>
                              <p className="font-medium text-gray-900">
                                {q.questionText || "Question text unavailable"}
                              </p>
                            </div>
                            {q.isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
                            <div
                              className={`p-2 rounded-lg ${
                                q.isCorrect ? "bg-green-100" : "bg-red-100"
                              }`}
                            >
                              <p className="text-xs text-gray-500 mb-1">
                                Your Answer
                              </p>
                              <p
                                className={`font-medium ${
                                  q.isCorrect
                                    ? "text-green-800"
                                    : "text-red-800"
                                }`}
                              >
                                {q.selectedAnswerText || "No answer"}
                              </p>
                            </div>
                            {!q.isCorrect && (
                              <div className="p-2 rounded-lg bg-green-50 border border-green-100">
                                <p className="text-xs text-gray-500 mb-1">
                                  Correct Answer
                                </p>
                                <p className="font-medium text-green-800">
                                  {q.correctAnswerText || "View full solution"}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-400 text-right">
                            Time spent: {q.timeSpent}s
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Retake Quiz */}
                <div className="text-center">
                  <button
                    onClick={() =>
                      navigate("/analytics/quiz", {
                        state: {
                          surveyData: {
                            company: latestSurvey.company,
                            domain: latestSurvey.domain,
                            role: latestSurvey.role,
                            skills: latestSurvey.skills,
                          },
                        },
                      })
                    }
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                  >
                    Retake Quiz
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AnalyticsResultsPage;
