import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDataProvider, Title, useGetIdentity } from "react-admin";
import {
  ArrowLeft,
  Clock,
  Check,
  X,
  Trophy,
  Grid3x3,
  Home,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Target,
  RotateCcw,
} from "lucide-react";

const QuizPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dataProvider = useDataProvider();
  const { identity } = useGetIdentity();
  const [searchParams] = useSearchParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showPreStart, setShowPreStart] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);

  // Quiz result tracking
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [questionStartTimes, setQuestionStartTimes] = useState({});
  const [questionTimings, setQuestionTimings] = useState({});
  const [existingResults, setExistingResults] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  // Replay mode
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayQuestionIds, setReplayQuestionIds] = useState([]);

  // Fetch quiz data and existing attempts
  useEffect(() => {
    const fetchQuizAndAttempts = async () => {
      try {
        setLoading(true);

        // Check for replay mode
        const replayParam = searchParams.get("replay");
        if (replayParam) {
          const questionIds = replayParam.split(",").filter(Boolean);
          setIsReplayMode(true);
          setReplayQuestionIds(questionIds);
        }

        // Fetch quiz
        const { data } = await dataProvider.getOne("quizzes", {
          id,
          meta: { populate: ["questions", "subject", "topic", "creator"] },
        });
        setQuiz(data);

        // Filter questions if in replay mode
        let quizQuestions = data.questions || [];
        if (replayParam) {
          const questionIds = replayParam.split(",").filter(Boolean);
          quizQuestions = quizQuestions.filter(
            (q) =>
              questionIds.includes(q.id) || questionIds.includes(q.documentId)
          );
        }
        setQuestions(quizQuestions);

        if (data.timeLimit && !replayParam) {
          setTimeRemaining(data.timeLimit * 60);
        }

        // Fetch existing quiz results for this user and quiz
        if (identity?.id) {
          try {
            const { data: results } = await dataProvider.getList(
              "quiz-results",
              {
                filter: {
                  user: identity.id,
                  // Use numeric ID for relation filter - Strapi v5 requires numeric IDs
                  quiz: data.id,
                },
                pagination: { page: 1, perPage: 100 },
                sort: { field: "createdAt", order: "DESC" },
              }
            );
            setExistingResults(results || []);
            setAttemptsUsed(results?.length || 0);
          } catch (error) {
            console.error("Error fetching quiz results:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndAttempts();
  }, [id, dataProvider, identity, searchParams]);

  // Helper function to get question ID consistently
  const getQuestionId = (question) => question?.documentId || question?.id;
  const getOptionId = (option) => option?.documentId || option?.id;

  const currentQuestion = questions[currentQuestionIndex];

  // Track question timing
  useEffect(() => {
    if (!currentQuestion) return;

    const questionId = getQuestionId(currentQuestion);
    const now = new Date();

    // Save timing for previous question if exists
    const prevQuestion = questions[currentQuestionIndex - 1];
    const prevQuestionId = getQuestionId(prevQuestion);
    if (prevQuestionId && questionStartTimes[prevQuestionId]) {
      const timeSpent = Math.floor(
        (now - questionStartTimes[prevQuestionId]) / 1000
      );
      setQuestionTimings((prev) => ({
        ...prev,
        [prevQuestionId]: (prev[prevQuestionId] || 0) + timeSpent,
      }));
    }

    // Start timing for current question
    if (!questionStartTimes[questionId]) {
      setQuestionStartTimes((prev) => ({
        ...prev,
        [questionId]: now,
      }));
    }
  }, [currentQuestionIndex, currentQuestion]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResults]);

  const handleAnswerSelect = (optionId) => {
    const questionId = getQuestionId(currentQuestion);
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionId,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Calculate final timing for current question
    const now = new Date();
    const currentQuestionId = getQuestionId(currentQuestion);
    if (currentQuestionId && questionStartTimes[currentQuestionId]) {
      const timeSpent = Math.floor(
        (now - questionStartTimes[currentQuestionId]) / 1000
      );
      setQuestionTimings((prev) => ({
        ...prev,
        [currentQuestionId]: (prev[currentQuestionId] || 0) + timeSpent,
      }));
    }

    // Create quiz result
    try {
      const score = calculateScore();
      const totalTimeTaken = quizStartTime
        ? Math.floor((now - quizStartTime) / 1000)
        : 0;

      // Build question analysis
      const questionAnalysis = score.questionResults.map((result, index) => ({
        questionId: result.question.documentId || result.question.id,
        questionText: result.question.questionText,
        isCorrect: result.isCorrect,
        isAttempted: result.isAttempted,
        selectedAnswer: result.selectedAnswer,
        correctAnswer:
          result.correctOption?.documentId || result.correctOption?.id,
        correctAnswerText: result.correctOption?.option,
        timeSpent:
          questionTimings[result.question.documentId || result.question.id] ||
          0,
        difficulty: result.question.difficulty,
      }));

      const quizResultData = {
        // Use numeric ID for relations - Strapi v5 requires numeric IDs, not documentId strings
        quiz: quiz.id,
        user: identity.id,
        // For subject/topic relations, use numeric ID
        subject:
          quiz.subject?.id ||
          (typeof quiz.subject === "number" ? quiz.subject : null),
        topic:
          quiz.topic?.id ||
          (typeof quiz.topic === "number" ? quiz.topic : null),
        // For questions relation, use numeric IDs
        questions: questions.map((q) => q.id),
        score: score.correct,
        totalQuestions: score.total,
        percentage: score.percentage,
        correctAnswers: score.correct,
        incorrectAnswers: score.wrong,
        unansweredQuestions: score.notAttempted,
        isPassed: score.percentage >= (quiz.passingScore || 70),
        timeTaken: totalTimeTaken,
        attemptNumber: attemptsUsed + 1,
        startedAt: quizStartTime,
        completedAt: now,
        questionTimings,
        questionAnalysis,
        answers: questionAnalysis.map((q) => ({
          questionId: q.questionId,
          selectedOption: q.selectedAnswer,
          isCorrect: q.isCorrect,
          timeSpent: q.timeSpent,
        })),
      };

      await dataProvider.create("quiz-results", {
        data: quizResultData,
      });

      console.log("Quiz result created successfully");
    } catch (error) {
      console.error("Error creating quiz result:", error);
    }

    setShowResults(true);
  };

  const handleExitQuiz = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    navigate(-1);
  };

  const calculateScore = () => {
    let correct = 0;
    let wrong = 0;
    let attempted = 0;
    const questionResults = [];

    questions.forEach((question) => {
      const questionId = getQuestionId(question);
      const selectedAnswer = selectedAnswers[questionId];
      const correctOption = question.options?.find((opt) => opt.isCorrect);
      const correctOptionId = getOptionId(correctOption);
      const isAttempted = selectedAnswer !== undefined;
      const isCorrect = selectedAnswer === correctOptionId;

      if (isAttempted) attempted++;
      if (isCorrect) correct++;
      if (isAttempted && !isCorrect) wrong++;

      questionResults.push({
        question,
        selectedAnswer,
        correctOption,
        isAttempted,
        isCorrect,
      });
    });

    const notAttempted = questions.length - attempted;
    const percentage =
      questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const marks = correct; // Assuming 1 mark per question

    return {
      correct,
      wrong,
      attempted,
      notAttempted,
      total: questions.length,
      percentage,
      marks,
      totalMarks: questions.length,
      questionResults,
    };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-bold text-gray-800">Loading quiz...</div>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 max-w-md border border-border/50 shadow-sm">
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            Quiz not found or has no questions
          </h2>
          <p className="text-gray-600 mb-6">
            This quiz might have been removed or doesn't contain any questions
            yet.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if attempts exceeded (but allow replay mode)
  const canStartQuiz =
    isReplayMode || !quiz.maxAttempts || attemptsUsed < quiz.maxAttempts;
  const attemptsRemaining = quiz.maxAttempts
    ? quiz.maxAttempts - attemptsUsed
    : Infinity;

  // Pre-Start Screen
  if (showPreStart && !quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Title title={quiz.title} />
        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-border/50 shadow-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-2">
              {isReplayMode ? "Replay Quiz" : quiz.title}
            </h1>
            {quiz.subject && (
              <p className="text-gray-500 font-medium">{quiz.subject.name}</p>
            )}
          </div>

          {/* Quiz Info */}
          <div className="space-y-4 mb-6">
            {isReplayMode && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-800">Replay Mode</p>
                    <p className="text-sm text-blue-600">
                      Practicing {questions.length} selected question
                      {questions.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Grid3x3 className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-500 font-medium">
                    Questions
                  </span>
                </div>
                <p className="text-2xl font-black text-gray-800">
                  {questions.length}
                </p>
              </div>

              {timeRemaining !== null && !isReplayMode && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-500 font-medium">
                      Time Limit
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-800">
                    {quiz.timeLimit} min
                  </p>
                </div>
              )}

              {!isReplayMode && quiz.passingScore && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-500 font-medium">
                      Passing Score
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-800">
                    {quiz.passingScore}%
                  </p>
                </div>
              )}

              {!isReplayMode && quiz.maxAttempts > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-500 font-medium">
                      Attempts
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-800">
                    {attemptsUsed} / {quiz.maxAttempts}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attempts Warning */}
          {!canStartQuiz && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800 mb-1">
                    Maximum Attempts Reached
                  </p>
                  <p className="text-sm text-red-600">
                    You have used all {quiz.maxAttempts} attempts for this quiz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Last Attempt Warning */}
          {canStartQuiz && attemptsRemaining === 1 && !isReplayMode && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-orange-800 mb-1">
                    Last Attempt!
                  </p>
                  <p className="text-sm text-orange-600">
                    This is your final attempt for this quiz. Make it count!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {quiz.instructions && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-2">Instructions</h3>
              <div
                className="text-sm text-gray-600"
                dangerouslySetInnerHTML={{ __html: quiz.instructions }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setQuizStarted(true);
                setShowPreStart(false);
                setQuizStartTime(new Date());
              }}
              disabled={!canStartQuiz}
              className={`flex-1 px-6 py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                canStartQuiz
                  ? "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:scale-105"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Trophy className="w-5 h-5" />
              Start Quiz
            </button>
          </div>

          {/* Attempts Remaining Info */}
          {canStartQuiz && attemptsRemaining !== Infinity && !isReplayMode && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                <span className="font-bold">{attemptsRemaining}</span> attempt
                {attemptsRemaining !== 1 ? "s" : ""} remaining
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    const score = calculateScore();
    const passed = score.percentage >= (quiz.passingScore || 70);

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Title title="Quiz Results" />
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-gray-800">
                Quiz Results
              </h1>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary font-bold transition-colors rounded-xl hover:bg-gray-50"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Subjects</span>
              </button>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-8">
            <div className="text-center mb-8">
              <div
                className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-4 ${
                  passed
                    ? "bg-green-50 border-green-500"
                    : "bg-red-50 border-red-500"
                }`}
              >
                {passed ? (
                  <Trophy className="w-12 h-12 text-green-600" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h2 className="text-6xl font-black text-gray-800 mb-2">
                {score.percentage}%
              </h2>
              <p
                className={`text-2xl font-bold mb-2 ${
                  passed ? "text-green-600" : "text-red-600"
                }`}
              >
                {passed
                  ? "🎉 Congratulations! You Passed!"
                  : "Keep Practicing!"}
              </p>
              <p className="text-gray-600 text-lg">
                You scored {score.marks} out of {score.totalMarks} marks
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <div className="text-3xl font-black text-green-700 mb-1">
                  {score.correct}
                </div>
                <div className="text-sm text-green-600 font-bold">Correct</div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
                <XCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                <div className="text-3xl font-black text-red-700 mb-1">
                  {score.wrong}
                </div>
                <div className="text-sm text-red-600 font-bold">Wrong</div>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 text-center">
                <Check className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-black text-blue-700 mb-1">
                  {score.attempted}
                </div>
                <div className="text-sm text-blue-600 font-bold">Attempted</div>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 text-center">
                <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <div className="text-3xl font-black text-gray-700 mb-1">
                  {score.notAttempted}
                </div>
                <div className="text-sm text-gray-600 font-bold">Skipped</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center border-t border-gray-200 pt-6">
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                disabled={
                  quiz.maxAttempts > 0 && attemptsUsed + 1 >= quiz.maxAttempts
                }
              >
                {quiz.maxAttempts > 0 && attemptsUsed + 1 >= quiz.maxAttempts
                  ? "Max Attempts Reached"
                  : "Retry Quiz"}
              </button>
              <button
                onClick={() => navigate("/progress")}
                className="px-8 py-4 bg-white border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                View Progress Report
              </button>
              <button
                onClick={() => navigate("/browse-subjects")}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Browse Subjects
              </button>
            </div>

            {/* Attempts Info */}
            {quiz.maxAttempts > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  <span className="font-bold">
                    {quiz.maxAttempts - (attemptsUsed + 1)}
                  </span>{" "}
                  {quiz.maxAttempts - (attemptsUsed + 1) === 1
                    ? "attempt"
                    : "attempts"}{" "}
                  remaining
                </p>
              </div>
            )}
          </div>

          {/* Question Review */}
          <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-8">
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <Grid3x3 className="w-7 h-7 text-primary" />
              Question Review
            </h2>
            <div className="space-y-4">
              {score.questionResults.map((result, index) => (
                <div
                  key={result.question.id}
                  className={`rounded-2xl border-2 p-5 transition-all ${
                    !result.isAttempted
                      ? "border-gray-200 bg-gray-50"
                      : result.isCorrect
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 ${
                        !result.isAttempted
                          ? "bg-gray-300 text-gray-700"
                          : result.isCorrect
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-lg mb-3">
                        {result.question.questionText}
                      </p>
                      <div className="space-y-2">
                        {!result.isAttempted ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-semibold">Not attempted</p>
                          </div>
                        ) : result.isCorrect ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="w-5 h-5" />
                            <p className="font-semibold">Correct answer!</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-700">
                              <XCircle className="w-5 h-5" />
                              <p className="font-semibold">Incorrect</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-green-300">
                              <p className="text-sm text-gray-600 mb-1">
                                Correct answer:
                              </p>
                              <p className="font-bold text-green-700">
                                {result.correctOption?.option}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {result.isCorrect && (
                      <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                    )}
                    {result.isAttempted && !result.isCorrect && (
                      <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Player
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const hasHint = currentQuestion?.hints && currentQuestion.hints.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Title title={quiz.title} />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border/50">
            <h3 className="text-xl font-black text-gray-800 mb-2">
              Exit Quiz?
            </h3>
            <p className="text-gray-600 mb-6">
              Your progress will be lost. Are you sure you want to exit?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Top Navigation Bar */}
        <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {/* Exit Button - Left */}
            <button
              onClick={handleExitQuiz}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 font-bold transition-colors rounded-xl hover:bg-red-50"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
            {/* Quiz Title - Center */}
            <div className="flex-1 text-center px-4">
              <h1 className="text-2xl font-black text-gray-800">
                {quiz.title}
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            {/* Attempts Badge - Between title and timer */}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <Trophy className="w-5 h-5" />
              <span className="font-black text-sm">
                {quiz.maxAttempts > 0
                  ? `Attempt ${attemptsUsed + 1} / ${quiz.maxAttempts}`
                  : "Unlimited Attempts"}
              </span>
            </div>
            {/* Timer - Right */}
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-xl border border-orange-200">
                <Clock className="w-5 h-5" />
                <span className="font-black">{formatTime(timeRemaining)}</span>
              </div>
            )}
            {timeRemaining === null && <div className="w-24" />} {/* Spacer */}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question Area - Left/Center */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-8">
              {/* Question Image */}
              {currentQuestion?.questionImage?.url && (
                <div className="mb-8 flex justify-center">
                  <img
                    src={currentQuestion.questionImage.url}
                    alt="Question illustration"
                    className="max-w-full max-h-80 object-contain rounded-2xl shadow-md"
                  />
                </div>
              )}

              {/* Question Text */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold">
                    Question {currentQuestionIndex + 1}
                  </span>
                  {currentQuestion?.difficulty && (
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                        currentQuestion.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : currentQuestion.difficulty === "hard"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-black text-gray-800 leading-relaxed">
                  {currentQuestion?.questionText}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Choose your answer
                </p>
                {currentQuestion?.options?.map((option, index) => {
                  const questionId = getQuestionId(currentQuestion);
                  const optionId = getOptionId(option);
                  const isSelected = selectedAnswers[questionId] === optionId;
                  const letters = ["A", "B", "C", "D", "E", "F"];

                  return (
                    <button
                      key={optionId || index}
                      onClick={() => handleAnswerSelect(optionId)}
                      className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center gap-4 hover:shadow-md ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-gray-200 hover:border-primary/30 bg-white"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {letters[index]}
                      </div>
                      <span className="font-semibold text-gray-800 text-lg flex-1">
                        {option.option || option.text}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Hint Button - Center */}
              <button
                disabled={!hasHint}
                className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all shadow-sm ${
                  hasHint
                    ? "bg-yellow-50 border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    : "bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                title={hasHint ? "Show hint" : "No hint available"}
              >
                <AlertCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Hint</span>
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                >
                  <span className="hidden sm:inline">Submit Quiz</span>
                  <Trophy className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              )}
            </div>
          </div>

          {/* Question Navigation - Right Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-black text-gray-800 mb-4">
                Questions
              </h3>

              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((q, index) => {
                  const questionId = getQuestionId(q);
                  const isAnswered = selectedAnswers[questionId] !== undefined;
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={questionId}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`aspect-square rounded-xl font-bold text-sm transition-all border-2 ${
                        isCurrent && isAnswered
                          ? "bg-green-500 text-white border-green-600 shadow-md scale-110"
                          : isCurrent
                          ? "bg-orange-100 text-orange-700 border-orange-300 shadow-md scale-110"
                          : isAnswered
                          ? "bg-green-100 text-green-700 border-green-300 hover:scale-105"
                          : "bg-white text-gray-600 border-gray-200 hover:scale-105 hover:border-gray-300"
                      }`}
                      title={
                        isCurrent && isAnswered
                          ? "Current (Answered)"
                          : isCurrent
                          ? "Current (Not Answered)"
                          : isAnswered
                          ? "Answered"
                          : "Not Answered"
                      }
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-3 text-sm border-t border-gray-200 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500 border-2 border-green-600" />
                  <span className="text-gray-700 font-medium">
                    Answered (Current)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 border-2 border-orange-300" />
                  <span className="text-gray-700 font-medium">
                    Draft (Current)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 border-2 border-green-300" />
                  <span className="text-gray-700 font-medium">Answered</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border-2 border-gray-200" />
                  <span className="text-gray-700 font-medium">
                    Not Answered
                  </span>
                </div>
              </div>

              {/* Quiz Stats */}
              <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Answered:</span>
                    <span className="font-black text-green-700">
                      {Object.keys(selectedAnswers).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-black text-orange-700">
                      {questions.length - Object.keys(selectedAnswers).length}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600 font-bold">Total:</span>
                    <span className="font-black text-gray-800">
                      {questions.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPlayer;
