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
          meta: { populate: ["questions", "subject", "topics", "creator"] },
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
      <div className="min-h-screen bg-white flex flex-col px-4 py-6 pb-20">
        <Title title={quiz.title} />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
            {isReplayMode ? "Replay Quiz" : quiz.title}
          </h1>
          {quiz.subject && (
            <p className="text-sm text-gray-500">{quiz.subject.name}</p>
          )}
        </div>

        {/* Quiz Info */}
        <div className="flex-1 space-y-4">
          {isReplayMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800 text-sm">
                    Replay Mode
                  </p>
                  <p className="text-xs text-blue-600">
                    Practicing {questions.length} question
                    {questions.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Grid3x3 className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Questions</span>
              </div>
              <p className="text-xl font-bold text-gray-800">
                {questions.length}
              </p>
            </div>

            {timeRemaining !== null && !isReplayMode && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Time</span>
                </div>
                <p className="text-xl font-bold text-gray-800">
                  {quiz.timeLimit} min
                </p>
              </div>
            )}

            {!isReplayMode && quiz.passingScore && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Pass</span>
                </div>
                <p className="text-xl font-bold text-gray-800">
                  {quiz.passingScore}%
                </p>
              </div>
            )}

            {!isReplayMode && quiz.maxAttempts > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Trophy className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Attempts</span>
                </div>
                <p className="text-xl font-bold text-gray-800">
                  {attemptsUsed} / {quiz.maxAttempts}
                </p>
              </div>
            )}
          </div>

          {/* Attempts Warning */}
          {!canStartQuiz && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">
                  Maximum attempts reached ({quiz.maxAttempts})
                </p>
              </div>
            </div>
          )}

          {/* Last Attempt Warning */}
          {canStartQuiz && attemptsRemaining === 1 && !isReplayMode && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-700 font-medium">
                  Last attempt - make it count!
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {quiz.instructions && (
            <div className="bg-gray-50 rounded-xl p-3">
              <h3 className="font-semibold text-gray-800 text-sm mb-1">
                Instructions
              </h3>
              <div
                className="text-xs text-gray-600"
                dangerouslySetInnerHTML={{ __html: quiz.instructions }}
              />
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-3 mt-auto pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-sm"
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
            className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
              canStartQuiz
                ? "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-md"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Start Quiz
          </button>
        </div>

        {/* Attempts Remaining Info */}
        {canStartQuiz && attemptsRemaining !== Infinity && !isReplayMode && (
          <p className="text-xs text-gray-500 text-center mt-3">
            <span className="font-semibold">{attemptsRemaining}</span> attempt
            {attemptsRemaining !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    const score = calculateScore();
    const passed = score.percentage >= (quiz.passingScore || 70);

    return (
      <div className="min-h-screen bg-white px-4 py-4 pb-20">
        <Title title="Quiz Results" />
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-bold text-gray-800">
              Quiz Results
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-primary font-semibold transition-colors rounded-lg hover:bg-gray-100 text-sm"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>

          {/* Score Card */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="text-center mb-4">
              <div
                className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center border-4 ${
                  passed
                    ? "bg-green-50 border-green-500"
                    : "bg-red-50 border-red-500"
                }`}
              >
                {passed ? (
                  <Trophy className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-1">
                {score.percentage}%
              </h2>
              <p
                className={`text-base font-semibold ${
                  passed ? "text-green-600" : "text-red-600"
                }`}
              >
                {passed ? "🎉 You Passed!" : "Keep Practicing!"}
              </p>
              <p className="text-sm text-gray-500">
                {score.marks} / {score.totalMarks} marks
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-green-50 rounded-xl p-2 text-center">
                <div className="text-xl font-bold text-green-700">
                  {score.correct}
                </div>
                <div className="text-[10px] text-green-600">Correct</div>
              </div>
              <div className="bg-red-50 rounded-xl p-2 text-center">
                <div className="text-xl font-bold text-red-700">
                  {score.wrong}
                </div>
                <div className="text-[10px] text-red-600">Wrong</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-2 text-center">
                <div className="text-xl font-bold text-blue-700">
                  {score.attempted}
                </div>
                <div className="text-[10px] text-blue-600">Done</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-2 text-center">
                <div className="text-xl font-bold text-gray-700">
                  {score.notAttempted}
                </div>
                <div className="text-[10px] text-gray-600">Skip</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm"
              disabled={
                quiz.maxAttempts > 0 && attemptsUsed + 1 >= quiz.maxAttempts
              }
            >
              {quiz.maxAttempts > 0 && attemptsUsed + 1 >= quiz.maxAttempts
                ? "Max Reached"
                : "Retry"}
            </button>
            <button
              onClick={() => navigate("/progress")}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm"
            >
              Progress
            </button>
          </div>

          {/* Question Review */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Grid3x3 className="w-4 h-4 text-primary" />
              Question Review
            </h2>
            <div className="space-y-2">
              {score.questionResults.map((result, index) => (
                <div
                  key={result.question.id}
                  className={`rounded-xl p-3 ${
                    !result.isAttempted
                      ? "bg-gray-50"
                      : result.isCorrect
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        !result.isAttempted
                          ? "bg-gray-300 text-gray-700"
                          : result.isCorrect
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">
                        {result.question.questionText}
                      </p>
                      {!result.isAttempted ? (
                        <p className="text-xs text-gray-500">Not attempted</p>
                      ) : result.isCorrect ? (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Correct
                        </p>
                      ) : (
                        <p className="text-xs text-red-600">
                          ✗ Answer: {result.correctOption?.option}
                        </p>
                      )}
                    </div>
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

      <div className="min-h-screen flex flex-col px-4 py-4 pb-20 max-w-7xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 mb-4">
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
            <div className="flex-1 text-center px-2">
              <h1 className="text-base md:text-2xl font-black text-gray-800">
                {quiz.title}
              </h1>
              <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">
                Q {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
            {/* Attempts Badge - Between title and timer */}
            <div className="hidden md:flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <Trophy className="w-5 h-5" />
              <span className="font-black text-sm">
                {quiz.maxAttempts > 0
                  ? `Attempt ${attemptsUsed + 1} / ${quiz.maxAttempts}`
                  : "Unlimited Attempts"}
              </span>
            </div>
            {/* Timer - Right */}
            {timeRemaining !== null && (
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-orange-50 text-orange-700 rounded-xl border border-orange-200">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-black text-sm md:text-base">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            {timeRemaining === null && <div className="w-16 md:w-24" />}{" "}
            {/* Spacer */}
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 gap-4">
          {/* Question Area */}
          <div>
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 md:p-8">
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
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-bold">
                    Q{currentQuestionIndex + 1}
                  </span>
                  {currentQuestion?.difficulty && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs md:text-sm font-bold ${
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
                <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-gray-800 leading-tight md:leading-relaxed">
                  {currentQuestion?.questionText}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
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
                      className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-gray-200 hover:border-primary/30 bg-white"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {letters[index]}
                      </div>
                      <span className="font-medium text-gray-800 text-sm md:text-base flex-1">
                        {option.option || option.text}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-2 mt-4">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Question Counter - Center */}
              <div className="text-sm font-bold text-gray-500">
                {currentQuestionIndex + 1} / {questions.length}
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-md transition-all text-sm"
                >
                  <span>Submit</span>
                  <Trophy className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-md transition-all text-sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              )}
            </div>
          </div>

          {/* Question Navigation - Right Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 sticky top-24">
              <h3 className="text-sm font-bold text-gray-800 mb-3">
                Questions
              </h3>

              <div className="grid grid-cols-5 gap-1.5 mb-4">
                {questions.map((q, index) => {
                  const questionId = getQuestionId(q);
                  const isAnswered = selectedAnswers[questionId] !== undefined;
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={questionId}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`aspect-square rounded-lg font-bold text-xs transition-all border ${
                        isCurrent && isAnswered
                          ? "bg-green-500 text-white border-green-600"
                          : isCurrent
                          ? "bg-orange-100 text-orange-700 border-orange-300"
                          : isAnswered
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Quiz Stats - Compact */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-bold text-green-700">
                    {Object.keys(selectedAnswers).length} / {questions.length}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${
                        (Object.keys(selectedAnswers).length /
                          questions.length) *
                        100
                      }%`,
                    }}
                  />
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
