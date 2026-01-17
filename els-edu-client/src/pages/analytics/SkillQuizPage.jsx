import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Title, useGetIdentity, useNotify } from "react-admin";
import { useNavigate, useLocation } from "react-router-dom";
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
  Shield,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import * as analyticsService from "../../services/analyticsService";
import mongoService from "../../services/mongoService";

const QUIZ_TIME_LIMIT = 30 * 60; // 30 minutes in seconds
const QUESTIONS_PER_SKILL = 5; // Number of questions per skill

const SkillQuizPage = () => {
  const { identity } = useGetIdentity();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();

  // Get survey data from navigation state
  const surveyData = location.state?.surveyData;
  const surveyId = location.state?.surveyId;

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(QUIZ_TIME_LIMIT);
  const [existingQuiz, setExistingQuiz] = useState(null);
  const [questionStartTimes, setQuestionStartTimes] = useState({});

  // Skill-topic mapping for attributing questions to skills
  const [skillTopicMap, setSkillTopicMap] = useState({});

  // Role check
  const userRole = identity?.user_role || "STUDENT";
  const isAdmin = ["ADMIN", "SUPERADMIN"].includes(userRole);

  // Check for existing quiz
  useEffect(() => {
    const checkExistingQuiz = async () => {
      try {
        const results = await mongoService.getUserQuizzes({
          filters: {
            type: "SKILL",
            // Sort by most recent
          },
          sort: { createdAt: "desc" },
        });

        if (results?.data?.length > 0 && !isAdmin) {
          setExistingQuiz(results.data[0]);
        }
      } catch (error) {
        console.error("Error checking existing quiz:", error);
      }
    };
    if (identity) checkExistingQuiz();
  }, [identity, isAdmin]);

  // Fetch quiz questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!surveyData?.skills?.length) {
        notify("No survey data found. Please complete self-assessment first.", {
          type: "warning",
        });
        navigate("/analytics/survey");
        return;
      }

      setLoading(true);
      try {
        const skillNames = surveyData.skills.map((s) => s.skillName);
        const topicsData = await analyticsService.getQuizTopics(skillNames);
        const { skills: skillsWithTopics, topics } = topicsData || {};

        if (!topics || topics.length === 0) {
          notify("No topics found for selected skills.", { type: "info" });
          setQuestions([]);
          setLoading(false);
          return;
        }

        // Build skill-topic map
        const stMap = {};
        skillsWithTopics?.forEach((skill) => {
          skill.topicDocumentIds?.forEach((topicId) => {
            stMap[topicId] = skill.name;
          });
        });
        setSkillTopicMap(stMap);

        // Get questions for topics
        const topicIds = topics.map((t) => t.documentId);
        const questionsData = await analyticsService.getQuizQuestions(
          topicIds,
          5
        );

        const shuffled = (questionsData?.questions || []).sort(
          () => Math.random() - 0.5
        );
        setQuestions(shuffled);
      } catch (error) {
        console.error("Error fetching quiz questions:", error);
        notify("Failed to load quiz questions", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [surveyData, navigate, notify]);

  // Timer countdown
  useEffect(() => {
    if (!quizStarted || showResults || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when timer reaches 0
          setTimeout(() => handleSubmit(), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, showResults]);

  // Track question start times
  useEffect(() => {
    if (!quizStarted || questions.length === 0) return;
    const currentQ = questions[currentIndex];
    const qId = currentQ?.documentId || currentQ?.id;
    if (qId && !questionStartTimes[qId]) {
      setQuestionStartTimes((prev) => ({ ...prev, [qId]: Date.now() }));
    }
  }, [currentIndex, quizStarted, questions]);

  // Prevent navigation
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

  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleSelectAnswer = (optionId) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.documentId || currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [qId]: optionId }));
  };

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const now = Date.now();
      const answerData = questions.map((q) => {
        const qId = q.documentId || q.id;
        const selectedId = answers[qId];
        const selectedOption = q.options?.find(
          (o) => (o.documentId || o.id) === selectedId
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

      // Calculate score
      const total = questions.length;
      let correct = 0;
      questions.forEach((q, idx) => {
        if (answerData[idx].isCorrect) correct++;
      });
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
      const scoreData = { correct, total, percentage };

      // Calculate skill breakdown
      const skillStats = {};
      answerData.forEach((ans) => {
        const skill = ans.skillName;
        if (!skillStats[skill]) {
          skillStats[skill] = {
            skillName: skill,
            correctAnswers: 0,
            questionsAttempted: 0,
          };
        }
        skillStats[skill].questionsAttempted++;
        if (ans.isCorrect) skillStats[skill].correctAnswers++;
      });

      const skillResults = Object.values(skillStats).map((s) => {
        const p =
          s.questionsAttempted > 0
            ? Math.round((s.correctAnswers / s.questionsAttempted) * 100)
            : 0;
        // Determine level based on percentage (Simple logic)
        let level = 1;
        if (p >= 80) level = 5;
        else if (p >= 60) level = 4;
        else if (p >= 40) level = 3;
        else if (p >= 20) level = 2;

        return {
          ...s,
          percentage: p,
          actualLevel: level,
        };
      });

      const resultPayload = {
        type: "SKILL",
        surveyId,
        company: surveyData?.company,
        role: surveyData?.role,
        domain: surveyData?.domain,
        answers: answerData,
        score: scoreData,
        summary: { skillResults },
      };

      const result = await mongoService.createUserQuiz(resultPayload);

      setQuizResult(result.data || result); // Handle wrapper if any
      setShowResults(true);
      notify("Quiz completed!", { type: "success" });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      notify("Failed to submit quiz", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const score = useMemo(() => {
    const total = questions.length;
    let correct = 0;

    questions.forEach((q) => {
      const qId = q.documentId || q.id;
      const selectedId = answers[qId];
      if (selectedId) {
        const selectedOption = q.options?.find(
          (o) => (o.documentId || o.id) === selectedId
        );
        if (selectedOption?.isCorrect) correct++;
      }
    });

    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }, [questions, answers]);

  // Loading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p className="text-lg font-medium">Loading skill quiz...</p>
        </div>
      </div>
    );
  }

  // Already completed (students only)
  if (existingQuiz && !isAdmin) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quiz Already Completed
          </h2>
          <p className="text-gray-600 mb-6">
            You have already completed the skill assessment quiz. You cannot
            retake it.
          </p>
          <button
            onClick={() => navigate("/analytics")}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold"
          >
            View Your Results
          </button>
        </div>
      </div>
    );
  }

  // No questions
  if (questions.length === 0 && !loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Questions Available
          </h2>
          <p className="text-gray-600 mb-6">
            No questions found for your selected skills. Please ensure topics
            have questions linked.
          </p>
          <button
            onClick={() => navigate("/analytics")}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold"
          >
            Back to Analytics
          </button>
        </div>
      </div>
    );
  }

  // Instructions screen
  if (showInstructions && !quizStarted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  Important Instructions
                </h2>
                <p className="text-sm text-gray-500">
                  Please read carefully before starting
                </p>
              </div>
            </div>

            {/* Instructions List */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <p className="text-sm text-gray-700">
                  This quiz will assess your knowledge across different skills
                  based on your selected role and company.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <p className="text-sm text-gray-700">
                  Each skill will have{" "}
                  <span className="font-bold text-gray-900">
                    {QUESTIONS_PER_SKILL} questions
                  </span>
                  . Answer them to the best of your ability.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <p className="text-sm text-gray-700">
                  There is{" "}
                  <span className="font-bold text-gray-900">no time limit</span>
                  . Take your time to think through each question.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">4</span>
                </div>
                <p className="text-sm text-gray-700">
                  Your results will be saved and you'll receive personalized
                  learning recommendations.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/analytics/self-assessment")}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setShowInstructions(false);
                  startQuiz();
                }}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const passed = score.percentage >= 60;
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 overflow-y-auto z-[9999] p-4">
        <Title title="Quiz Results" />
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-3xl p-8 text-center mb-6">
            <div
              className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                passed ? "bg-green-100" : "bg-orange-100"
              }`}
            >
              {passed ? (
                <Trophy className="w-12 h-12 text-green-600" />
              ) : (
                <Target className="w-12 h-12 text-orange-600" />
              )}
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-2">
              {score.percentage}%
            </h2>
            <p
              className={`text-lg font-semibold ${
                passed ? "text-green-600" : "text-orange-600"
              }`}
            >
              {passed ? "🎉 Great Job!" : "Keep Learning!"}
            </p>
            <p className="text-gray-500 mt-2">
              {score.correct} correct out of {score.total} questions
            </p>
          </div>

          {quizResult?.summary?.skillResults && (
            <div className="bg-white rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Skill Breakdown
              </h3>
              <div className="space-y-3">
                {quizResult.summary.skillResults.map((skill) => (
                  <div
                    key={skill.skillName}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <span className="font-medium text-gray-900">
                      {skill.skillName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {skill.correctAnswers}/{skill.questionsAttempted}
                      </span>
                      <span
                        className={`px-2 py-1 text-sm font-bold rounded-full ${
                          skill.percentage >= 75
                            ? "bg-green-100 text-green-700"
                            : skill.percentage >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        L{skill.actualLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/analytics")}
            className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold"
          >
            View Full Analysis
            <Sparkles className="inline-block ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Quiz player (fullscreen)
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      <Title title="Skill Quiz" />

      {/* Header with timer */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-indigo-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Skill Assessment
              </h1>
              <p className="text-xs text-gray-500">
                Q {currentIndex + 1} of {questions.length}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${
              timeRemaining < 300
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeRemaining)}
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {currentQuestion && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="mb-6">
                <span className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
                  {skillTopicMap[currentQuestion.topicDocumentId] || "General"}
                </span>
                <h2 className="text-lg font-semibold text-gray-900 mt-1">
                  {currentQuestion.questionText}
                </h2>
              </div>

              <div className="space-y-3">
                {currentQuestion.options?.map((option, idx) => {
                  const optionId = option.documentId || option.id;
                  const qId = currentQuestion.documentId || currentQuestion.id;
                  const isSelected = answers[qId] === optionId;

                  return (
                    <button
                      key={optionId}
                      onClick={() => handleSelectAnswer(optionId)}
                      className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                        isSelected
                          ? "bg-indigo-50 border-2 border-indigo-500"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isSelected
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span
                        className={`flex-1 ${
                          isSelected
                            ? "text-indigo-900 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {option.option}
                      </span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question nav dots */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {questions.map((q, idx) => {
              const qId = q.documentId || q.id;
              const isAnswered = answers[qId] !== undefined;
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={qId}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-indigo-500 text-white"
                      : isAnswered
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Quiz
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillQuizPage;
