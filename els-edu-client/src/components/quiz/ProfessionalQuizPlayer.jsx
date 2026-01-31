import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  Check,
  X,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Target,
  Brain,
  Sparkles,
  Flag,
  ChevronLeft,
  ChevronRight,
  Menu,
  Grid3x3,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Bookmark,
  BookmarkCheck,
  Timer,
  Send,
  BarChart3,
} from "lucide-react";

// Question status enum
const QuestionStatus = {
  NOT_VISITED: "not_visited",
  VISITED: "visited",
  ANSWERED: "answered",
  MARKED: "marked",
  MARKED_ANSWERED: "marked_answered",
};

/**
 * ProfessionalQuizPlayer - A premium quiz player component
 *
 * Props:
 * - questions: Array of question objects with { documentId/id, questionText, options }
 * - timeLimit: Time limit in seconds (e.g., 1800 for 30 mins)
 * - onSubmit: Callback with answers array
 * - onExit: Callback when user wants to exit
 * - skillTopicMap: Object mapping topicDocumentId to skill name
 * - surveyData: Survey metadata (company, role, domain)
 * - quizTitle: Title to display
 */
const ProfessionalQuizPlayer = ({
  questions = [],
  timeLimit = 30 * 60, // 30 minutes default
  onSubmit,
  onExit,
  skillTopicMap = {},
  surveyData = {},
  quizTitle = "Skill Assessment Quiz",
}) => {
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStatus, setQuestionStatus] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [questionStartTimes, setQuestionStartTimes] = useState({});

  // Get question ID helper
  const getQuestionId = useCallback((q) => q?.documentId || q?.id, []);

  // Current question
  const currentQuestion = questions[currentIndex];
  const currentQId = currentQuestion ? getQuestionId(currentQuestion) : null;

  // Statistics
  const stats = useMemo(() => {
    const answered = Object.values(answers).filter(Boolean).length;
    const marked = Object.values(questionStatus).filter(
      (s) =>
        s === QuestionStatus.MARKED || s === QuestionStatus.MARKED_ANSWERED,
    ).length;
    const visited = Object.values(questionStatus).filter(
      (s) => s !== QuestionStatus.NOT_VISITED,
    ).length;

    return {
      total: questions.length,
      answered,
      unanswered: questions.length - answered,
      marked,
      visited,
      notVisited: questions.length - visited,
    };
  }, [answers, questionStatus, questions.length]);

  // Timer countdown
  useEffect(() => {
    if (!quizStarted || showResults || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, showResults, timeRemaining]);

  // Mark question as visited when viewing
  useEffect(() => {
    if (!quizStarted || !currentQId) return;

    setQuestionStatus((prev) => {
      const current = prev[currentQId];
      if (!current || current === QuestionStatus.NOT_VISITED) {
        return { ...prev, [currentQId]: QuestionStatus.VISITED };
      }
      return prev;
    });

    // Track start time for this question
    if (!questionStartTimes[currentQId]) {
      setQuestionStartTimes((prev) => ({ ...prev, [currentQId]: Date.now() }));
    }
  }, [currentIndex, quizStarted, currentQId]);

  // Prevent accidental navigation
  useEffect(() => {
    if (quizStarted && !showResults) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = "Your quiz progress will be lost!";
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [quizStarted, showResults]);

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    const percentage = (timeRemaining / timeLimit) * 100;
    if (percentage <= 10) return "text-red-600 bg-red-100 animate-pulse";
    if (percentage <= 25) return "text-orange-600 bg-orange-100";
    if (percentage <= 50) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  // Handle answer selection
  const handleSelectAnswer = (optionId) => {
    if (!currentQId) return;

    setAnswers((prev) => ({ ...prev, [currentQId]: optionId }));
    setQuestionStatus((prev) => {
      const current = prev[currentQId];
      const isMarked =
        current === QuestionStatus.MARKED ||
        current === QuestionStatus.MARKED_ANSWERED;
      return {
        ...prev,
        [currentQId]: isMarked
          ? QuestionStatus.MARKED_ANSWERED
          : QuestionStatus.ANSWERED,
      };
    });
  };

  // Toggle mark for review
  const toggleMarkForReview = () => {
    if (!currentQId) return;

    setQuestionStatus((prev) => {
      const current = prev[currentQId];
      const isAnswered =
        current === QuestionStatus.ANSWERED ||
        current === QuestionStatus.MARKED_ANSWERED;

      if (
        current === QuestionStatus.MARKED ||
        current === QuestionStatus.MARKED_ANSWERED
      ) {
        return {
          ...prev,
          [currentQId]: isAnswered
            ? QuestionStatus.ANSWERED
            : QuestionStatus.VISITED,
        };
      }
      return {
        ...prev,
        [currentQId]: isAnswered
          ? QuestionStatus.MARKED_ANSWERED
          : QuestionStatus.MARKED,
      };
    });
  };

  // Navigation
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const jumpToQuestion = (index) => {
    setCurrentIndex(index);
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  // Start quiz
  const startQuiz = () => {
    setShowInstructions(false);
    setQuizStarted(true);
    setQuestionStatus({
      [getQuestionId(questions[0])]: QuestionStatus.VISITED,
    });
    setQuestionStartTimes({ [getQuestionId(questions[0])]: Date.now() });
  };

  // Calculate score
  const calculateScore = useCallback(() => {
    let correct = 0;
    let total = questions.length;

    questions.forEach((q) => {
      const qId = getQuestionId(q);
      const selectedId = answers[qId];
      if (selectedId) {
        const selectedOption = q.options?.find(
          (o) => (o.documentId || o.id) === selectedId,
        );
        if (selectedOption?.isCorrect) correct++;
      }
    });

    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }, [questions, answers, getQuestionId]);

  // Submit quiz
  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    setSubmitting(true);

    try {
      const now = Date.now();
      const answerData = questions.map((q) => {
        const qId = getQuestionId(q);
        const selectedId = answers[qId];
        const selectedOption = q.options?.find(
          (o) => (o.documentId || o.id) === selectedId,
        );
        const correctOption = q.options?.find((o) => o.isCorrect);
        const skillName = skillTopicMap[q.topicDocumentId] || "General";
        const startTime = questionStartTimes[qId] || now;
        const timeSpent = Math.floor((now - startTime) / 1000);

        return {
          questionId: qId,
          questionText: q.questionText,
          topicDocumentId: q.topicDocumentId,
          skillName,
          selectedAnswer: selectedId,
          selectedAnswerText: selectedOption?.option,
          correctAnswer: correctOption?.documentId || correctOption?.id,
          correctAnswerText: correctOption?.option,
          isCorrect: selectedOption?.isCorrect === true,
          timeSpent,
        };
      });

      const score = calculateScore();
      const result = { answerData, score };

      if (onSubmit) {
        const submittedResult = await onSubmit(result);
        setQuizResult(submittedResult);
      } else {
        setQuizResult(result);
      }

      setShowResults(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Get status icon for question
  const getStatusIcon = (qId, index) => {
    const status = questionStatus[qId];
    const isAnswered = answers[qId] !== undefined;
    const isCurrent = index === currentIndex;

    if (isCurrent) {
      return (
        <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-primary-500/30">
          {index + 1}
        </div>
      );
    }

    if (
      status === QuestionStatus.MARKED ||
      status === QuestionStatus.MARKED_ANSWERED
    ) {
      return (
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
            isAnswered
              ? "bg-purple-500 text-white"
              : "bg-purple-100 text-purple-700 border-2 border-purple-300"
          }`}
        >
          {index + 1}
        </div>
      );
    }

    if (isAnswered) {
      return (
        <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>
      );
    }

    if (status === QuestionStatus.VISITED) {
      return (
        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 border-2 border-orange-300 flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
        {index + 1}
      </div>
    );
  };

  // Progress percentage
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  // ========== RENDER ==========

  // Instructions screen
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        {/* Hide Scrollbar Style */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
              display: none;
          }
          .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
          }
        `}</style>

        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-hide relative overflow-hidden">
          {/* Decorative Header Background */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary-500/10 via-violet-500/5 to-transparent pointer-events-none" />

          <div className="p-6 md:p-10 relative z-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mb-6 shadow-xl shadow-primary-500/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
                {quizTitle}
              </h1>
              <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
                Test your skills and get personalized recommendations for your
                career path
              </p>
            </div>

            {/* Quiz Stats Cards */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mb-10">
              <div className="bg-white rounded-2xl p-4 md:p-5 text-center border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                <div className="text-3xl font-black text-gray-900 mb-1">
                  {questions.length}
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Questions
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 md:p-5 text-center border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                <div className="text-3xl font-black text-gray-900 mb-1">
                  {Math.floor(timeLimit / 60)}
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Minutes
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 md:p-5 text-center border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                <div className="text-3xl font-black text-gray-900 mb-1">
                  {Object.keys(skillTopicMap).length || "?"}
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Skills
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 mb-8 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                </div>
                Important Instructions
              </h3>
              <ul className="space-y-3">
                {[
                  {
                    icon: Check,
                    color: "text-emerald-500",
                    text: "Choose the best answer for each question",
                  },
                  {
                    icon: Check,
                    color: "text-emerald-500",
                    text: "Navigate between questions using the grid",
                  },
                  {
                    icon: AlertTriangle,
                    color: "text-orange-500",
                    text: "Quiz will auto-submit when time runs out",
                  },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                  >
                    <item.icon
                      className={`w-5 h-5 ${item.color} flex-shrink-0`}
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 sticky bottom-0 bg-white pt-2 pb-2">
              {onExit && (
                <button
                  onClick={onExit}
                  className="px-8 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
                >
                  Go Back
                </button>
              )}
              <button
                onClick={startQuiz}
                className="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold shadow-xl shadow-gray-900/20 hover:shadow-gray-900/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Start Quiz Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const score = calculateScore();
    const passed = score.percentage >= 60;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
        <div className="min-h-screen p-4 md:p-8">
          <div className="max-w-3xl mx-auto py-8">
            {/* Score Card */}
            <div className="bg-white rounded-3xl p-8 text-center mb-6 shadow-2xl">
              <div
                className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  passed
                    ? "bg-gradient-to-br from-green-400 to-emerald-500"
                    : "bg-gradient-to-br from-orange-400 to-amber-500"
                } shadow-xl`}
              >
                {passed ? (
                  <Trophy className="w-12 h-12 text-white" />
                ) : (
                  <Target className="w-12 h-12 text-white" />
                )}
              </div>
              <h2 className="text-6xl font-black text-gray-900 mb-2">
                {score.percentage}%
              </h2>
              <p
                className={`text-xl font-bold ${
                  passed ? "text-green-600" : "text-orange-600"
                }`}
              >
                {passed ? "🎉 Excellent Work!" : "Keep Learning!"}
              </p>
              <p className="text-gray-500 mt-2">
                {score.correct} correct out of {score.total} questions
              </p>

              {/* Time spent */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                <Timer className="w-4 h-4" />
                Time spent: {formatTime(timeLimit - timeRemaining)}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.answered}
                </div>
                <div className="text-xs text-gray-500">Answered</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.unanswered}
                </div>
                <div className="text-xs text-gray-500">Unanswered</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {score.correct}
                </div>
                <div className="text-xs text-gray-500">Correct</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {score.total - score.correct}
                </div>
                <div className="text-xs text-gray-500">Incorrect</div>
              </div>
            </div>

            {/* Skill Breakdown */}
            {quizResult?.summary?.skillResults && (
              <div className="bg-white rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-500" />
                  Skill Breakdown
                </h3>
                <div className="space-y-3">
                  {quizResult.summary.skillResults.map((skill) => (
                    <div
                      key={skill.skillName}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">
                          {skill.skillName}
                        </span>
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            skill.percentage >= 75
                              ? "bg-green-100 text-green-700"
                              : skill.percentage >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          Level {skill.actualLevel}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            skill.percentage >= 75
                              ? "bg-green-500"
                              : skill.percentage >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${skill.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>
                          {skill.correctAnswers}/{skill.questionsAttempted}{" "}
                          correct
                        </span>
                        <span>{skill.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={onExit}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold shadow-xl hover:shadow-primary-500/50 transition-all flex items-center justify-center gap-2"
            >
              View Full Analysis
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Submit confirmation modal
  const SubmitConfirmModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Quiz?</h3>
          <p className="text-gray-500">
            Please review your answers before submitting.
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-green-600">
              {stats.answered}
            </div>
            <div className="text-xs text-green-700">Answered</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-red-600">
              {stats.unanswered}
            </div>
            <div className="text-xs text-red-700">Unanswered</div>
          </div>
        </div>

        {stats.unanswered > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6 text-center">
            <p className="text-sm text-yellow-800">
              ⚠️ You have <strong>{stats.unanswered}</strong> unanswered
              questions
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowSubmitConfirm(false)}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
          >
            Review Again
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:shadow-green-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Main quiz player
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {showSubmitConfirm && <SubmitConfirmModal />}

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Grid3x3 className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-gray-900">
                  Q {currentIndex + 1}/{questions.length}
                </h1>
                <p className="text-xs text-gray-500">
                  {stats.answered} answered
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-bold ${getTimerColor()}`}
            >
              <Clock className="w-4 h-4" />
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Mobile Question Grid (Collapsible) */}
        {showSidebar && (
          <div className="absolute top-24 left-0 right-0 bg-white border-b border-gray-200 shadow-lg p-4 z-50 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Questions</h3>
              <button onClick={() => setShowSidebar(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={getQuestionId(q)}
                  onClick={() => jumpToQuestion(idx)}
                >
                  {getStatusIcon(getQuestionId(q), idx)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-200">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">{quizTitle}</h1>
              <p className="text-xs text-gray-500">
                {questions.length} Questions
              </p>
            </div>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-lg font-bold ${getTimerColor()}`}
          >
            <Clock className="w-5 h-5" />
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">
                {stats.answered}
              </div>
              <div className="text-[10px] text-green-700 uppercase font-medium">
                Answered
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-600">
                {stats.unanswered}
              </div>
              <div className="text-[10px] text-red-700 uppercase font-medium">
                Unanswered
              </div>
            </div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Questions
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <button
                key={getQuestionId(q)}
                onClick={() => jumpToQuestion(idx)}
                className="hover:scale-110 transition-transform"
              >
                {getStatusIcon(getQuestionId(q), idx)}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Legend
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100"></div>
                <span className="text-gray-600">Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
                <span className="text-gray-600">Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-gray-600">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500"></div>
                <span className="text-gray-600">Marked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold shadow-lg hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Quiz
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <h2 className="text-sm font-bold text-primary-600">
                {skillTopicMap[currentQuestion?.topicDocumentId] ||
                  "General Knowledge"}
              </h2>
            </div>
            <div className="h-2 flex-1 mx-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            {currentQuestion && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
                {/* Question */}
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full mb-3">
                    {skillTopicMap[currentQuestion.topicDocumentId] ||
                      "General"}
                  </span>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-relaxed">
                    {currentQuestion.questionText}
                  </h2>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, idx) => {
                    const optionId = option.documentId || option.id;
                    const isSelected = answers[currentQId] === optionId;

                    return (
                      <button
                        key={optionId}
                        onClick={() => handleSelectAnswer(optionId)}
                        className={`w-full p-4 md:p-5 rounded-xl text-left transition-all duration-200 flex items-center gap-4 group ${
                          isSelected
                            ? "bg-primary-50 border-2 border-primary-500 shadow-lg shadow-primary-100"
                            : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                            isSelected
                              ? "bg-primary-500 text-white"
                              : "bg-white text-gray-600 border border-gray-200 group-hover:border-gray-300"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span
                          className={`flex-1 text-base ${
                            isSelected
                              ? "text-primary-900 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {option.option}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-6 h-6 text-primary-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-white border-t border-gray-200 px-4 py-4 md:px-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-3 md:px-6 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Mark for Review */}
            <button
              onClick={toggleMarkForReview}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                questionStatus[currentQId] === QuestionStatus.MARKED ||
                questionStatus[currentQId] === QuestionStatus.MARKED_ANSWERED
                  ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                  : "bg-gray-100 text-gray-600 hover:bg-purple-50"
              }`}
            >
              {questionStatus[currentQId] === QuestionStatus.MARKED ||
              questionStatus[currentQId] === QuestionStatus.MARKED_ANSWERED ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">Mark for Review</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-3 md:px-6 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="flex items-center gap-2 px-4 py-3 md:px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-green-500/30 transition-all lg:hidden"
              >
                Submit
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalQuizPlayer;
