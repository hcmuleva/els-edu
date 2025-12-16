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
        console.error("Error fetching quiz results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [identity, dataProvider]);

  // Calculate analytics
  const stats = {
    totalAttempts: quizResults.length,
    passed: quizResults.filter((r) => r.isPassed).length,
    failed: quizResults.filter((r) => !r.isPassed).length,
    averageScore:
      quizResults.length > 0
        ? Math.round(
            quizResults.reduce((sum, r) => sum + r.percentage, 0) /
              quizResults.length
          )
        : 0,
    totalTimeSpent: quizResults.reduce((sum, r) => sum + (r.timeTaken || 0), 0),
    totalCorrect: quizResults.reduce((sum, r) => sum + r.correctAnswers, 0),
    totalWrong: quizResults.reduce((sum, r) => sum + r.incorrectAnswers, 0),
    totalSkipped: quizResults.reduce(
      (sum, r) => sum + r.unansweredQuestions,
      0
    ),
  };

  // Filter results
  const filteredResults = quizResults.filter((result) =>
    result.quiz?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
        <div className="relative">
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

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-4">
              No quiz attempts found
            </p>
            <button
              onClick={() => navigate("/browse-subjects")}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Start Your First Quiz
            </button>
          </div>
        ) : (
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((record) => (
                  <React.Fragment key={record.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setExpandedRow(
                          expandedRow === record.id ? null : record.id
                        );
                      }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-gray-800">
                            {record.quiz?.title || "Untitled Quiz"}
                          </div>
                          {record.subject && (
                            <div className="text-xs text-gray-500">
                              {record.subject.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(record.completedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-2xl font-black ${
                              record.isPassed
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {record.percentage}%
                          </span>
                          <span className="text-xs text-gray-500">
                            ({record.score}/{record.totalQuestions})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            record.isPassed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.isPassed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(record.timeTaken || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/quiz/${
                                record.quiz?.documentId || record.quiz?.id
                              }/play`
                            );
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-lg hover:shadow-md transition-all flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      </td>
                    </tr>
                    {expandedRow === record.id && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <QuizResultExpand record={record} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
