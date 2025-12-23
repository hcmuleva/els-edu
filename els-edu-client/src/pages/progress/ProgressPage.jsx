import React, { useState, useEffect } from "react";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";

// Question Breakdown Component
const QuizResultExpand = ({ record }) => {
  if (!record || !record.questionAnalysis) {
    return (
      <div className="bg-gray-50 p-6 border-t border-gray-200">
        <p className="text-gray-500 text-center text-sm">
          No question data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 border-t border-gray-100">
      <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
        Question Breakdown
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {record.questionAnalysis.map((q, index) => (
          <div
            key={index}
            className={`p-3 rounded-xl border ${
              !q.isAttempted
                ? "border-gray-200 bg-white"
                : q.isCorrect
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  !q.isAttempted
                    ? "bg-gray-300 text-gray-700"
                    : q.isCorrect
                    ? "bg-emerald-500 text-white"
                    : "bg-rose-500 text-white"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-xs mb-1 line-clamp-2 leading-snug">
                  {q.questionText}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {!q.isAttempted ? (
                    <span className="text-gray-600">Skipped</span>
                  ) : q.isCorrect ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Correct
                    </span>
                  ) : (
                    <span className="text-rose-700 font-semibold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Wrong
                    </span>
                  )}
                  {q.timeSpent > 0 && (
                    <span className="text-gray-500">• {q.timeSpent}s</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProgressPage = () => {
  const dataProvider = useDataProvider();
  const { identity } = useGetIdentity();
  const navigate = useNavigate();

  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeFilter, setActiveTimeFilter] = useState("all");
  const [activeResultFilter, setActiveResultFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);

  // Fetch quiz results
  useEffect(() => {
    const fetchResults = async () => {
      if (!identity?.id) return;

      try {
        setLoading(true);
        const { data } = await dataProvider.getList("quiz-results", {
          filter: { user: identity.id },
          pagination: { page: 1, perPage: 1000 },
          sort: { field: "completedAt", order: "DESC" },
          meta: { populate: ["quiz", "subject"] },
        });
        setQuizResults(data || []);
      } catch (error) {
        console.error("Error fetching quiz results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [identity, dataProvider]);

  // Filter by time period
  const getFilteredByTime = (results) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    switch (activeTimeFilter) {
      case "today":
        return results.filter((r) => new Date(r.completedAt) >= today);
      case "week":
        return results.filter((r) => new Date(r.completedAt) >= weekAgo);
      case "month":
        return results.filter((r) => new Date(r.completedAt) >= monthAgo);
      case "year":
        return results.filter((r) => new Date(r.completedAt) >= yearAgo);
      default:
        return results;
    }
  };

  // Filter by result type
  const getFilteredByResult = (results) => {
    switch (activeResultFilter) {
      case "passed":
        return results.filter((r) => r.isPassed);
      case "failed":
        return results.filter((r) => !r.isPassed);
      case "wrong":
        return results.filter((r) => r.incorrectAnswers > 0);
      case "skipped":
        return results.filter((r) => r.unansweredQuestions > 0);
      case "perfect":
        return results.filter((r) => r.percentage === 100);
      default:
        return results;
    }
  };

  const timeFilteredResults = getFilteredByTime(quizResults);
  const filteredResults = getFilteredByResult(timeFilteredResults);

  // Calculate stats from time-filtered results (for charts)
  const stats = {
    totalAttempts: timeFilteredResults.length,
    passed: timeFilteredResults.filter((r) => r.isPassed).length,
    failed: timeFilteredResults.filter((r) => !r.isPassed).length,
    averageScore:
      timeFilteredResults.length > 0
        ? Math.round(
            timeFilteredResults.reduce((sum, r) => sum + r.percentage, 0) /
              timeFilteredResults.length
          )
        : 0,
    totalTimeSpent: timeFilteredResults.reduce(
      (sum, r) => sum + (r.timeTaken || 0),
      0
    ),
    totalCorrect: timeFilteredResults.reduce(
      (sum, r) => sum + r.correctAnswers,
      0
    ),
    totalWrong: timeFilteredResults.reduce(
      (sum, r) => sum + r.incorrectAnswers,
      0
    ),
    totalSkipped: timeFilteredResults.reduce(
      (sum, r) => sum + r.unansweredQuestions,
      0
    ),
  };

  // Score trend (last 10 attempts from time-filtered results)
  const scoreTrendData = timeFilteredResults
    .slice(0, 10)
    .reverse()
    .map((r, i) => r.percentage);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Chart click handlers
  const handlePieChartClick = (event, itemIdentifier, item) => {
    if (item && item.dataIndex !== undefined) {
      // 0 = Passed, 1 = Failed
      const clickedFilter = item.dataIndex === 0 ? "passed" : "failed";
      setActiveResultFilter(clickedFilter);
    }
  };

  const handleBarChartClick = (event, params) => {
    if (params && params.seriesId) {
      // Map series to filters
      if (params.seriesId.includes("Correct")) {
        setActiveResultFilter("perfect");
      } else if (params.seriesId.includes("Wrong")) {
        setActiveResultFilter("wrong");
      } else if (params.seriesId.includes("Skipped")) {
        setActiveResultFilter("skipped");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-600">
            Loading progress...
          </p>
        </div>
      </div>
    );
  }

  // Result filter options with counts
  const resultFilters = [
    {
      id: "all",
      label: "All Results",
      count: timeFilteredResults.length,
      color: "primary",
    },
    {
      id: "passed",
      label: "Passed",
      count: stats.passed,
      color: "emerald",
      icon: CheckCircle2,
    },
    {
      id: "failed",
      label: "Failed",
      count: stats.failed,
      color: "rose",
      icon: XCircle,
    },
    {
      id: "wrong",
      label: "Has Wrong",
      count: timeFilteredResults.filter((r) => r.incorrectAnswers > 0).length,
      color: "orange",
      icon: XCircle,
    },
    {
      id: "skipped",
      label: "Has Skipped",
      count: timeFilteredResults.filter((r) => r.unansweredQuestions > 0)
        .length,
      color: "amber",
      icon: AlertCircle,
    },
    {
      id: "perfect",
      label: "Perfect Score",
      count: timeFilteredResults.filter((r) => r.percentage === 100).length,
      color: "violet",
      icon: Trophy,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
      <Title title="My Progress" />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md shadow-violet-200">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                My Progress
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                Track your quiz performance
              </p>
            </div>
          </div>

          {/* Time Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "1 Week" },
              { id: "month", label: "1 Month" },
              { id: "year", label: "1 Year" },
              { id: "all", label: "All Time" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveTimeFilter(filter.id);
                  setActiveResultFilter("all"); // Reset result filter when changing time
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTimeFilter === filter.id
                    ? "bg-primary-500 text-white shadow-md shadow-primary-200"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4 pb-20 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                Total
              </p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-gray-900">
              {stats.totalAttempts}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              </div>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                Avg
              </p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-orange-600">
              {stats.averageScore}%
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              </div>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                Passed
              </p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-emerald-600">
              {stats.passed}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
              </div>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                Time
              </p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-violet-600">
              {Math.round(stats.totalTimeSpent / 60)}m
            </p>
          </div>
        </div>

        {/* Charts Section - Interactive */}
        {timeFilteredResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pass vs Fail Donut Chart - INTERACTIVE */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary-500" />
                Pass vs Fail
                <span className="text-xs font-normal text-gray-400 ml-auto">
                  Click to filter
                </span>
              </h3>
              <PieChart
                series={[
                  {
                    data: [
                      {
                        id: 0,
                        value: stats.passed,
                        label: "Passed",
                        color: "#10b981",
                      },
                      {
                        id: 1,
                        value: stats.failed,
                        label: "Failed",
                        color: "#f87171",
                      },
                    ],
                    innerRadius: 35,
                    outerRadius: 65,
                    paddingAngle: 3,
                    cornerRadius: 6,
                    highlightScope: { faded: "global", highlighted: "item" },
                  },
                ]}
                height={180}
                slotProps={{
                  legend: {
                    direction: "row",
                    position: { vertical: "bottom", horizontal: "middle" },
                    padding: 0,
                  },
                }}
                onItemClick={handlePieChartClick}
              />
            </div>

            {/* Answer Distribution Bar Chart - INTERACTIVE */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Answer Distribution
                <span className="text-xs font-normal text-gray-400 ml-auto">
                  Click to filter
                </span>
              </h3>
              <BarChart
                series={[
                  {
                    id: "Correct",
                    data: [stats.totalCorrect],
                    label: "Correct",
                    color: "#10b981",
                  },
                  {
                    id: "Wrong",
                    data: [stats.totalWrong],
                    label: "Wrong",
                    color: "#f87171",
                  },
                  {
                    id: "Skipped",
                    data: [stats.totalSkipped],
                    label: "Skipped",
                    color: "#9ca3af",
                  },
                ]}
                height={180}
                xAxis={[{ scaleType: "band", data: ["Answers"] }]}
                slotProps={{
                  legend: {
                    direction: "row",
                    position: { vertical: "bottom", horizontal: "middle" },
                    padding: 0,
                  },
                }}
                onItemClick={handleBarChartClick}
              />
            </div>

            {/* Score Trend Line Chart - IMPROVED */}
            {scoreTrendData.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-500" />
                  Score Trend (Last 10)
                </h3>
                <LineChart
                  xAxis={[
                    {
                      data: scoreTrendData.map((_, i) => i + 1),
                      scaleType: "point",
                      label: "Attempt",
                    },
                  ]}
                  yAxis={[
                    {
                      min: 0,
                      max: 100,
                      label: "Score %",
                    },
                  ]}
                  series={[
                    {
                      data: scoreTrendData,
                      color: "#8b5cf6",
                      curve: "natural",
                      showMark: true,
                      area: true,
                    },
                  ]}
                  height={180}
                  slotProps={{
                    legend: { hidden: true },
                  }}
                  grid={{ vertical: true, horizontal: true }}
                />
              </div>
            )}
          </div>
        )}

        {/* Result Filter Pills */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-900">Filter:</span>
          {resultFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeResultFilter === filter.id;

            return (
              <button
                key={filter.id}
                onClick={() => setActiveResultFilter(filter.id)}
                disabled={filter.count === 0}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? filter.color === "primary"
                      ? "bg-primary-500 text-white"
                      : filter.color === "emerald"
                      ? "bg-emerald-500 text-white"
                      : filter.color === "rose"
                      ? "bg-rose-500 text-white"
                      : filter.color === "orange"
                      ? "bg-orange-500 text-white"
                      : filter.color === "amber"
                      ? "bg-amber-500 text-white"
                      : "bg-violet-500 text-white"
                    : filter.count === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {filter.label} ({filter.count})
              </button>
            );
          })}
          {activeResultFilter !== "all" && (
            <button
              onClick={() => setActiveResultFilter("all")}
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quiz Results List */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary-500" />
            Quiz Attempts ({filteredResults.length})
          </h2>

          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {timeFilteredResults.length === 0
                  ? "No quiz results yet"
                  : "No results match your filter"}
              </h3>
              <p className="text-gray-500 max-w-sm mb-6 leading-relaxed">
                {timeFilteredResults.length === 0
                  ? "Complete a quiz to see your progress and performance analytics"
                  : "Try selecting a different filter to see more results"}
              </p>
              {timeFilteredResults.length === 0 ? (
                <button
                  onClick={() => navigate("/browse-courses")}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-violet-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-violet-600 transition-all shadow-md"
                >
                  Browse Quizzes
                </button>
              ) : (
                <button
                  onClick={() => setActiveResultFilter("all")}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Clear Filter
                </button>
              )}
            </div>
          ) : (
            filteredResults.map((record, index) => {
              const isExpanded = expandedRow === record.id;

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all overflow-hidden"
                >
                  <div
                    className="p-3 md:p-4 cursor-pointer"
                    onClick={() => {
                      setExpandedRow(isExpanded ? null : record.id);
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Index Badge */}
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                        #{index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 mb-0.5 leading-snug truncate">
                              {record.quiz?.title ||
                                record.subject?.name ||
                                "Quiz Attempt"}
                            </h3>
                            {record.subject && record.quiz?.title && (
                              <p className="text-xs text-gray-500 truncate">
                                {record.subject.name}
                              </p>
                            )}
                          </div>

                          {/* Score Badge */}
                          <div className="flex-shrink-0">
                            <div
                              className={`px-3 py-1.5 rounded-lg font-black text-base ${
                                record.isPassed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {record.percentage}%
                            </div>
                          </div>
                        </div>

                        {/* Badges Row */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              record.isPassed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {record.isPassed ? "✓ Passed" : "✗ Failed"}
                          </span>
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(record.completedAt)}
                          </span>
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(record.timeTaken || 0)}
                          </span>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-4 gap-1.5 mb-3">
                          <div className="bg-emerald-50 rounded-md p-1.5 text-center">
                            <div className="text-sm font-black text-emerald-700">
                              {record.correctAnswers}
                            </div>
                            <div className="text-[10px] text-emerald-600">
                              Correct
                            </div>
                          </div>
                          <div className="bg-rose-50 rounded-md p-1.5 text-center">
                            <div className="text-sm font-black text-rose-700">
                              {record.incorrectAnswers}
                            </div>
                            <div className="text-[10px] text-rose-600">
                              Wrong
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-md p-1.5 text-center">
                            <div className="text-sm font-black text-gray-700">
                              {record.unansweredQuestions}
                            </div>
                            <div className="text-[10px] text-gray-600">
                              Skip
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded-md p-1.5 text-center">
                            <div className="text-sm font-black text-blue-700">
                              {record.totalQuestions}
                            </div>
                            <div className="text-[10px] text-blue-600">
                              Total
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* Full Retry Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/quiz/${
                                  record.quiz?.documentId || record.quiz?.id
                                }/play`
                              );
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-violet-500 text-white text-xs font-bold rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Retry Full Quiz
                          </button>

                          {/* Replay Wrong Questions */}
                          {record.incorrectAnswers > 0 &&
                            record.questionAnalysis && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const wrongQuestions = record.questionAnalysis
                                    .filter(
                                      (q) => q.isAttempted && !q.isCorrect
                                    )
                                    .map((q) => q.questionId);
                                  const uniqueQuestions = [
                                    ...new Set(wrongQuestions),
                                  ];
                                  navigate(
                                    `/quiz/${
                                      record.quiz?.documentId || record.quiz?.id
                                    }/play?replay=${uniqueQuestions.join(",")}`
                                  );
                                }}
                                className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-200 transition-all flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                Replay Wrong ({record.incorrectAnswers})
                              </button>
                            )}

                          {/* Replay Unanswered Questions */}
                          {record.unansweredQuestions > 0 &&
                            record.questionAnalysis && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const unansweredQuestions =
                                    record.questionAnalysis
                                      .filter((q) => !q.isAttempted)
                                      .map((q) => q.questionId);
                                  const uniqueQuestions = [
                                    ...new Set(unansweredQuestions),
                                  ];
                                  navigate(
                                    `/quiz/${
                                      record.quiz?.documentId || record.quiz?.id
                                    }/play?replay=${uniqueQuestions.join(",")}`
                                  );
                                }}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3" />
                                Replay Unanswered ({record.unansweredQuestions})
                              </button>
                            )}

                          {/* Expand Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(isExpanded ? null : record.id);
                            }}
                            className="ml-auto px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                Show Details
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Question Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <QuizResultExpand record={record} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
