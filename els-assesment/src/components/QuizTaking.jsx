import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function QuizTaking() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { quiz, session: initialSession } = location.state || {};

  const [session, setSession] = useState(initialSession);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!sessionId) {
      navigate('/quiz');
      return;
    }

    loadQuizSession();
  }, [sessionId]);

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQuestion = questions[currentQuestionIndex];
      setSelectedAnswer(answers[currentQuestion._id] || null);
    }
  }, [currentQuestionIndex, questions, answers]);

  // Timer effect
  useEffect(() => {
    if (!session || !session.startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      setTimeRemaining(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const loadQuizSession = async () => {
    try {
      setIsLoading(true);
      
      console.log('Loading quiz session:', sessionId);
      
      // Load session
      const sessionData = await api.getQuizSession(sessionId);
      console.log('Session data loaded:', sessionData);
      
      if (!sessionData) {
        throw new Error('Session not found');
      }
      
      if (!sessionData.questions || sessionData.questions.length === 0) {
        throw new Error('No questions found in session');
      }
      
      setSession(sessionData);

      // Load questions for this session
      console.log('Loading questions:', sessionData.questions);
      const questionPromises = sessionData.questions.map(qId => 
        api.request(`/quiz/questions/${qId}`).then(q => {
          // Remove correctAnswer for quiz taking
          const { correctAnswer, ...questionWithoutAnswer } = q;
          return questionWithoutAnswer;
        }).catch(err => {
          console.error(`Failed to load question ${qId}:`, err);
          throw err;
        })
      );
      const questionData = await Promise.all(questionPromises);
      console.log('Questions loaded:', questionData.length);
      
      if (questionData.length === 0) {
        throw new Error('No questions could be loaded');
      }
      
      setQuestions(questionData);
      
      // Load existing answers if any
      if (sessionData.answers) {
        setAnswers(sessionData.answers);
      }
    } catch (error) {
      console.error('Failed to load quiz session:', error);
      const errorMessage = error.message || 'Failed to load quiz. Please try again.';
      alert(`Failed to load quiz: ${errorMessage}`);
      navigate('/quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (optionId) => {
    setSelectedAnswer(optionId);
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion._id]: optionId,
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      const confirm = window.confirm(
        `You have answered ${Object.keys(answers).length} out of ${questions.length} questions. Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    try {
      setIsSubmitting(true);
      
      // Calculate time spent
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      // Submit answers
      const result = await api.submitQuizSession(sessionId, answers);
      
      // Navigate to results page
      navigate(`/quiz/results/${sessionId}`, { 
        state: { 
          result,
          quiz,
          timeSpent,
        } 
      });
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No questions found for this quiz.</p>
          <button
            onClick={() => navigate('/quiz')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Emeelan Logo" 
                className="h-10 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Emeelan</h1>
                <p className="text-xs text-gray-500">ELS Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
              <button
                onClick={() => navigate('/quiz')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={16} />
                <span>Exit Quiz</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {answeredCount} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-4">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {currentQuestion.skillType} • {currentQuestion.difficulty}
              </span>
              {currentQuestion.points > 1 && (
                <span className="ml-2 text-xs text-gray-600">
                  ({currentQuestion.points} points)
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-gray-900">{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowLeft size={20} />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Submit Quiz
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Next
                <ArrowLeft size={20} className="rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, index) => {
              const isAnswered = answers[q._id];
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isAnswered
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

