import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSelfAssessment } from '../contexts/SelfAssessmentContext';
import { selfAssessmentQuestions, categoryDisplayNames, categoryIcons } from '../lib/selfAssessmentQuestions';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = ['development', 'testing', 'devops', 'agentic-ai', 'mobile-app'];

export default function SelfAssessment() {
  const { user } = useAuth();
  const { saveSelfAssessment } = useSelfAssessment();
  const navigate = useNavigate();
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completedCategories, setCompletedCategories] = useState(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const currentCategory = categories[currentCategoryIndex];
  const questions = selfAssessmentQuestions[currentCategory];
  const currentQuestion = questions[currentQuestionIndex];
  const questionId = currentQuestion.id;
  const currentAnswer = answers[questionId] || 5;

  const handleRatingChange = (value) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Move to next category
      const newCompleted = new Set(completedCategories);
      newCompleted.add(currentCategory);
      setCompletedCategories(newCompleted);

      if (currentCategoryIndex < categories.length - 1) {
        setCurrentCategoryIndex(currentCategoryIndex + 1);
        setCurrentQuestionIndex(0);
      } else {
        // All categories completed - wait a moment for state to update
        setTimeout(() => {
          handleComplete();
        }, 100);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentCategoryIndex > 0) {
      // Go back to previous category
      setCurrentCategoryIndex(currentCategoryIndex - 1);
      const prevCategory = categories[currentCategoryIndex - 1];
      const prevQuestions = selfAssessmentQuestions[prevCategory];
      setCurrentQuestionIndex(prevQuestions.length - 1);
    }
  };

  const handleComplete = () => {
    // Transform answers into the format expected by the system
    const selfAssessment = {
      development: {},
      testing: {},
      devops: {},
      'agentic-ai': {},
      'mobile-app': {},
    };

    // Group answers by category
    Object.entries(answers).forEach(([questionId, rating]) => {
      // Find the category that contains this question
      for (const category of categories) {
        const questions = selfAssessmentQuestions[category];
        const question = questions.find(q => q.id === questionId);
        if (question) {
          selfAssessment[category][question.skill] = rating;
          break;
        }
      }
    });

    // Create user profile with self-assessment
    const userProfile = {
      name: user.name,
      background: 'student',
      yearsOfExperience: 0,
      selfAssessment,
    };

    saveSelfAssessment(userProfile);
    navigate('/quiz');
  };

  const handleCategorySelect = (index) => {
    if (index !== undefined) {
      setCurrentCategoryIndex(index);
      setCurrentQuestionIndex(0);
    }
  };

  const getCategoryProgress = (category) => {
    const questions = selfAssessmentQuestions[category];
    const answered = questions.filter(q => answers[q.id] !== undefined).length;
    return { answered, total: questions.length };
  };

  const allCategoriesCompleted = completedCategories.size === categories.length;

  // Show category selection if no category is selected or if viewing overview
  const [showCategorySelection, setShowCategorySelection] = useState(false);

  if (showCategorySelection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Emeelan Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Emeelan</h1>
                  <p className="text-xs text-gray-500">Self-Assessment</p>
                </div>
              </div>
              <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Self-Assessment</h1>
            <p className="text-gray-600 text-lg">
              Rate your skills in each category on a scale of 1-10. Complete all categories to proceed to the quiz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const progress = getCategoryProgress(category);
              const isCompleted = completedCategories.has(category);
              const isCurrent = index === currentCategoryIndex;

              return (
                <button
                  key={category}
                  onClick={() => {
                    handleCategorySelect(index);
                    setShowCategorySelection(false);
                  }}
                  className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg ${
                    isCompleted
                      ? 'border-green-500'
                      : isCurrent
                      ? 'border-blue-500'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{categoryIcons[category]}</span>
                    {isCompleted && <CheckCircle2 className="text-green-600" size={24} />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {categoryDisplayNames[category]}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {progress.answered}/{progress.total} questions
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      isCompleted
                        ? 'bg-green-100 text-green-700'
                        : progress.answered > 0
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {isCompleted ? 'Completed' : progress.answered > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {allCategoriesCompleted && (
            <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
              <CheckCircle2 className="text-green-600 mx-auto mb-2" size={48} />
              <h3 className="text-xl font-bold text-green-900 mb-2">All Categories Completed!</h3>
              <p className="text-green-700 mb-4">You can now proceed to take the quiz.</p>
              <button
                onClick={handleComplete}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Complete Assessment & Go to Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Emeelan Logo" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Emeelan</h1>
                <p className="text-xs text-gray-500">Self-Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCategorySelection(true)}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                View All Categories
              </button>
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {categoryDisplayNames[currentCategory]}
            </span>
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Progress */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {categories.map((cat, idx) => {
              const progress = getCategoryProgress(cat);
              const isCompleted = completedCategories.has(cat);
              const isCurrent = idx === currentCategoryIndex;
              return (
                <div
                  key={cat}
                  className={`flex items-center gap-2 text-xs ${
                    isCurrent ? 'text-blue-600 font-semibold' : 'text-gray-500'
                  }`}
                >
                  <span>{categoryIcons[cat]}</span>
                  <span className="hidden sm:inline">{categoryDisplayNames[cat]}</span>
                  {isCompleted && <CheckCircle2 size={14} className="text-green-600" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">{categoryIcons[currentCategory]}</span>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {categoryDisplayNames[currentCategory]}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentQuestion.question}</h2>
            <p className="text-gray-600">{currentQuestion.description}</p>
          </div>

          {/* Rating Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Rating</span>
              <span className="text-3xl font-bold text-blue-600">{currentAnswer}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={currentAnswer}
              onChange={(e) => handleRatingChange(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((currentAnswer - 1) / 9) * 100}%, #e5e7eb ${((currentAnswer - 1) / 9) * 100}%, #e5e7eb 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>1 - Beginner</span>
              <span>5 - Intermediate</span>
              <span>10 - Expert</span>
            </div>
          </div>

          {/* Rating Scale Indicators */}
          <div className="grid grid-cols-10 gap-2 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                key={value}
                onClick={() => handleRatingChange(value)}
                className={`h-12 rounded-lg font-semibold transition-all ${
                  currentAnswer === value
                    ? 'bg-blue-600 text-white scale-110 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentCategoryIndex === 0 && currentQuestionIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={20} />
              Previous
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              {categories.map((cat, idx) => {
                const isCompleted = completedCategories.has(cat);
                return (
                  <div key={cat} className="flex items-center">
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : (
                      <Circle size={16} className="text-gray-300" />
                    )}
                    {idx < categories.length - 1 && <ChevronRight size={16} className="text-gray-400" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              {currentQuestionIndex === questions.length - 1 && currentCategoryIndex === categories.length - 1
                ? 'Complete'
                : 'Next'}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

