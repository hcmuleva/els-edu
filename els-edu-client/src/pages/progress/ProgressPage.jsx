import React, { useState, useEffect } from "react";
import {
  Title,
  useDataProvider,
  useGetIdentity,
  Datagrid,
  List,
  FunctionField,
  ChipField,
  TextField,
} from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Search,
  RotateCcw,
  Home,
  Award,
  Target,
  TrendingUp,
} from "lucide-react";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

// Expandable Row Component - Question Breakdown
const QuizResultExpand = ({ record }) => {
  if (!record || !record.questionAnalysis) {
    return (
      <div className="bg-gray-50 p-6 border-t border-gray-200">
        <p className="text-gray-500 text-center">No question data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 border-t border-gray-200">
      <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
        Question Breakdown
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {record.questionAnalysis.map((q, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              !q.isAttempted
                ? "border-gray-200 bg-white"
                : q.isCorrect
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  !q.isAttempted
                    ? "bg-gray-300 text-gray-700"
                    : q.isCorrect
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-xs mb-1 line-clamp-2">
                  {q.questionText}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {!q.isAttempted ? (
                    <span className="text-gray-600">Skipped</span>
                  ) : q.isCorrect ? (
                    <span className="text-green-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Correct
                    </span>
                  ) : (
                    <span className="text-red-700 font-semibold flex items-center gap-1">
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
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterBy, setFilterBy] = useState("all"); // all, wrong, unanswered, perfect

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
          meta: { populate: ["quiz", "subject", "questionAnalysis.question"] },
        });
        console.log("Quiz results fetched:", data);
        setQuizResults(data || []);
      } catch (error) {
        console.error(" Error fetching quiz results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [identity, dataProvider]);

  // Filter results by search and status
  const getFilteredByStatus = (results) => {
    switch (filterBy) {
      case "wrong":
        return results.filter((r) => r.incorrectAnswers > 0);
      case "unanswered":
        return results.filter((r) => r.unansweredQuestions > 0);
      case "perfect":
        return results.filter((r) => r.percentage === 100);
      case "all":
      default:
        return results;
    }
  };

  const filteredByStatus = getFilteredByStatus(quizResults);
  const filteredResults = filteredByStatus.filter((result) =>
    result.quiz?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate analytics from filtered results
  const stats = {
    totalAttempts: filteredResults.length,
    passed: filteredResults.filter((r) => r.isPassed).length,
    failed: filteredResults.filter((r) => !r.isPassed).length,
    averageScore:
      filteredResults.length > 0
        ? Math.round(
            filteredResults.reduce((sum, r) => sum + r.percentage, 0) /
              filteredResults.length
          )
        : 0,
    totalTimeSpent: filteredResults.reduce(
      (sum, r) => sum + (r.timeTaken || 0),
      0
    ),
    totalCorrect: filteredResults.reduce((sum, r) => sum + r.correctAnswers, 0),
    totalWrong: filteredResults.reduce((sum, r) => sum + r.incorrectAnswers, 0),
    totalSkipped: filteredResults.reduce(
      (sum, r) => sum + r.unansweredQuestions,
      0
    ),
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-600">
            Loading progress...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <Title title="My Progress" />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-800 font-heading">
            My Progress
          </h1>
          <button
            onClick={() => navigate("/browse-subjects")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary font-bold transition-colors rounded-xl hover:bg-white"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Browse Subjects</span>
          </button>
        </div>
        <p className="text-gray-500 font-medium">
          Track your quiz performance and improvement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Total Attempts
              </p>
              <p className="text-3xl font-black text-gray-800">
                {stats.totalAttempts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Passed</p>
              <p className="text-3xl font-black text-green-700">
                {stats.passed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Average Score</p>
              <p className="text-3xl font-black text-orange-700">
                {stats.averageScore}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Time Spent</p>
              <p className="text-3xl font-black text-purple-700">
                {Math.round(stats.totalTimeSpent / 60)}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {quizResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Pass vs Fail
            </h3>
            <div style={{ height: 200 }}>
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
                        color: "#ef4444",
                      },
                    ],
                    innerRadius: 50,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
                height={200}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Answer Distribution
            </h3>
            <div style={{ height: 200 }}>
              <BarChart
                series={[
                  {
                    data: [stats.totalCorrect],
                    label: "Correct",
                    color: "#10b981",
                  },
                  {
                    data: [stats.totalWrong],
                    label: "Wrong",
                    color: "#ef4444",
                  },
                  {
                    data: [stats.totalSkipped],
                    label: "Skipped",
                    color: "#6b7280",
                  },
                ]}
                height={200}
                xAxis={[{ scaleType: "band", data: ["Answers"] }]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Filter Results</h3>
            {filterBy !== "all" && (
              <button
                onClick={() => setFilterBy("all")}
                className="text-sm text-primary hover:text-secondary font-bold"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterBy("all")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterBy === "all"
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Results ({quizResults.length})
            </button>
            <button
              onClick={() => setFilterBy("wrong")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterBy === "wrong"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <XCircle className="w-4 h-4 inline mr-1" />
              Has Wrong (
              {quizResults.filter((r) => r.incorrectAnswers > 0).length})
            </button>
            <button
              onClick={() => setFilterBy("unanswered")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterBy === "unanswered"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Has Unanswered (
              {quizResults.filter((r) => r.unansweredQuestions > 0).length})
            </button>
            <button
              onClick={() => setFilterBy("perfect")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterBy === "perfect"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-1" />
              Perfect Score (
              {quizResults.filter((r) => r.percentage === 100).length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search quiz attempts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Results Cards */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No results found
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search or filter"
                : "Complete a quiz to see your progress here"}
            </p>
          </div>
        ) : (
          filteredResults.map((record, index) => {
            const isExpanded = expandedRow === record.id;

            // Determine quiz type based on questionAnalysis
            let quizType = "Normal Quiz";
            let quizTypeBadgeColor = "bg-blue-100 text-blue-700";

            // Check if this is a replay quiz by looking at questionAnalysis counts
            if (record.questionAnalysis && record.questionAnalysis.length > 0) {
              const hasOnlyWrong = record.questionAnalysis.every(
                (q) => q.isAttempted && !q.isCorrect
              );
              const hasOnlyUnanswered = record.questionAnalysis.every(
                (q) => !q.isAttempted
              );

              if (hasOnlyWrong && record.incorrectAnswers > 0) {
                quizType = "Replay - Wrong Questions";
                quizTypeBadgeColor = "bg-red-100 text-red-700";
              } else if (hasOnlyUnanswered && record.unansweredQuestions > 0) {
                quizType = "Replay - Unanswered";
                quizTypeBadgeColor = "bg-orange-100 text-orange-700";
              }
            }

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => {
                    setExpandedRow(isExpanded ? null : record.id);
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Index Badge */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-white font-black text-lg flex items-center justify-center flex-shrink-0">
                      #{index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-1">
                            {record.quiz?.title || "Untitled Quiz"}
                          </h3>
                          {record.subject && (
                            <p className="text-sm text-gray-500">
                              {record.subject.name}
                            </p>
                          )}
                        </div>

                        {/* Score Badge */}
                        <div className="flex-shrink-0">
                          <div
                            className={`px-4 py-2 rounded-xl font-black text-2xl ${
                              record.isPassed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {record.percentage}%
                          </div>
                        </div>
                      </div>

                      {/* Quiz Type & Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${quizTypeBadgeColor}`}
                        >
                          {quizType}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            record.isPassed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.isPassed ? "✓ Passed" : "✗ Failed"}
                        </span>
                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(record.completedAt)}
                        </span>
                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatTime(record.timeTaken || 0)}
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-black text-green-700">
                            {record.correctAnswers}
                          </div>
                          <div className="text-xs text-green-600">Correct</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-black text-red-700">
                            {record.incorrectAnswers}
                          </div>
                          <div className="text-xs text-red-600">Wrong</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-black text-gray-700">
                            {record.unansweredQuestions}
                          </div>
                          <div className="text-xs text-gray-600">Skipped</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-black text-blue-700">
                            {record.totalQuestions}
                          </div>
                          <div className="text-xs text-blue-600">Total</div>
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
                          className="px-3 py-1.5 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-1"
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
                                // Extract wrong question IDs
                                const wrongQuestions = record.questionAnalysis
                                  .filter((q) => q.isAttempted && !q.isCorrect)
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
                              className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-all flex items-center justify-center gap-1"
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
                                // Extract unanswered question IDs
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Question Breakdown */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <QuizResultExpand record={record} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
