import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSelfAssessment } from '../contexts/SelfAssessmentContext';
import { enhancedSelfAssessmentQuestions, categoryDisplayNames, categoryIcons, aggregateSelfAssessment } from '../lib/enhancedSelfAssessmentQuestions';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = ['development', 'testing', 'devops', 'agentic-ai', 'mobile-app'];

export default function EnhancedSelfAssessment() {
  const { user } = useAuth();
  const { saveSelfAssessment } = useSelfAssessment();
  const navigate = useNavigate();
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentSkillTypeIndex, setCurrentSkillTypeIndex] = useState(0);
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completedCategories, setCompletedCategories] = useState(new Set());
  const [showCategorySelection, setShowCategorySelection] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const currentCategory = categories[currentCategoryIndex];
  const skillTypes = enhancedSelfAssessmentQuestions[currentCategory];
  const currentSkillType = skillTypes[currentSkillTypeIndex];
  const currentOption = currentSkillType.options[currentOptionIndex];
  const ratingKey = `${currentCategory}-${currentSkillType.id}-${currentOption.id}`;
  const currentAnswer = answers[ratingKey] || 5;

  const handleRatingChange = (value) => {
    setAnswers({
      ...answers,
      [ratingKey]: value,
    });
  };

  const handleNext = () => {
    // Move to next option within current skill type
    if (currentOptionIndex < currentSkillType.options.length - 1) {
      setCurrentOptionIndex(currentOptionIndex + 1);
    } else {
      // Finished current skill type - move to next skill type or category
      if (currentSkillTypeIndex < skillTypes.length - 1) {
        // Move to next skill type in same category
        setCurrentSkillTypeIndex(currentSkillTypeIndex + 1);
        setCurrentOptionIndex(0);
      } else {
        // Finished all skill types in current category
        const newCompleted = new Set(completedCategories);
        newCompleted.add(currentCategory);
        setCompletedCategories(newCompleted);

        if (currentCategoryIndex < categories.length - 1) {
          // Move to next category
          setCurrentCategoryIndex(currentCategoryIndex + 1);
          setCurrentSkillTypeIndex(0);
          setCurrentOptionIndex(0);
        } else {
          // All categories completed
          setTimeout(() => {
            handleComplete();
          }, 100);
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentOptionIndex > 0) {
      setCurrentOptionIndex(currentOptionIndex - 1);
    } else if (currentSkillTypeIndex > 0) {
      // Go back to previous skill type
      setCurrentSkillTypeIndex(currentSkillTypeIndex - 1);
      const prevSkillType = skillTypes[currentSkillTypeIndex - 1];
      setCurrentOptionIndex(prevSkillType.options.length - 1);
    } else if (currentCategoryIndex > 0) {
      // Go back to previous category
      setCurrentCategoryIndex(currentCategoryIndex - 1);
      const prevCategory = categories[currentCategoryIndex - 1];
      const prevSkillTypes = enhancedSelfAssessmentQuestions[prevCategory];
      setCurrentSkillTypeIndex(prevSkillTypes.length - 1);
      setCurrentOptionIndex(prevSkillTypes[prevSkillTypes.length - 1].options.length - 1);
    }
  };

  const handleComplete = () => {
    // Aggregate detailed ratings to expected format
    const aggregated = aggregateSelfAssessment(answers);

    // Create user profile with aggregated self-assessment and detailed ratings
    const userProfile = {
      name: user.name,
      background: 'student',
      yearsOfExperience: 0,
      selfAssessment: aggregated,
      detailedRatings: answers, // Include detailed ratings for MongoDB
    };

    saveSelfAssessment(userProfile);
    navigate('/quiz');
  };

  const handleCategorySelect = (index) => {
    if (index !== undefined) {
      setCurrentCategoryIndex(index);
      setCurrentSkillTypeIndex(0);
      setCurrentOptionIndex(0);
    }
  };

  const getCategoryProgress = (category) => {
    const skillTypes = enhancedSelfAssessmentQuestions[category];
    let totalOptions = 0;
    let answeredOptions = 0;

    skillTypes.forEach((skillType) => {
      skillType.options.forEach((option) => {
        totalOptions++;
        const ratingKey = `${category}-${skillType.id}-${option.id}`;
        if (answers[ratingKey] !== undefined) {
          answeredOptions++;
        }
      });
    });

    return { answered: answeredOptions, total: totalOptions };
  };

  const getSkillTypeProgress = (skillType) => {
    let answered = 0;
    skillType.options.forEach((option) => {
      const ratingKey = `${currentCategory}-${skillType.id}-${option.id}`;
      if (answers[ratingKey] !== undefined) {
        answered++;
      }
    });
    return { answered, total: skillType.options.length };
  };

  const allCategoriesCompleted = completedCategories.size === categories.length;

  // Calculate total progress
  const totalOptions = categories.reduce((sum, cat) => {
    return sum + enhancedSelfAssessmentQuestions[cat].reduce((catSum, st) => catSum + st.options.length, 0);
  }, 0);
  const totalAnswered = Object.keys(answers).length;
  const overallProgress = totalOptions > 0 ? (totalAnswered / totalOptions) * 100 : 0;

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

        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Self-Assessment</h1>
            <p className="text-gray-600 text-lg">
              Rate your skills in each category. Each category has multiple skill types with specific options to assess.
            </p>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Progress:</strong> {totalAnswered} of {totalOptions} skills assessed ({Math.round(overallProgress)}%)
              </p>
            </div>
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
                  className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg text-left ${
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{progress.answered}/{progress.total} skills</span>
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
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(progress.answered / progress.total) * 100}%` }}
                      />
                    </div>
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

  // Calculate current progress within category
  const categoryProgress = getCategoryProgress(currentCategory);
  const skillTypeProgress = getSkillTypeProgress(currentSkillType);
  const currentOptionNumber = skillTypes
    .slice(0, currentSkillTypeIndex)
    .reduce((sum, st) => sum + st.options.length, 0) + currentOptionIndex + 1;
  const totalOptionsInCategory = categoryProgress.total;

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
            <div className="flex items-center gap-2">
              <span className="text-2xl">{categoryIcons[currentCategory]}</span>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {categoryDisplayNames[currentCategory]}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {currentSkillType.skillType}
                </span>
              </div>
            </div>
            <span className="text-sm text-gray-600">
              {currentOptionNumber} of {totalOptionsInCategory}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentOptionNumber / totalOptionsInCategory) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Skill Type Progress - Clickable Navigation */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Skill Types (Click to navigate):</p>
          <div className="flex flex-wrap items-center gap-2">
            {skillTypes.map((st, idx) => {
              const progress = getSkillTypeProgress(st);
              const isCompleted = progress.answered === progress.total;
              const isCurrent = idx === currentSkillTypeIndex;
              return (
                <div key={st.id} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setCurrentSkillTypeIndex(idx);
                      setCurrentOptionIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all hover:scale-105 ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : isCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300 border border-gray-300'
                    }`}
                    title={`Click to assess ${st.skillType}`}
                  >
                    {st.skillType} ({progress.answered}/{progress.total})
                    {isCompleted && <CheckCircle2 size={12} className="inline-block ml-1" />}
                  </button>
                  {idx < skillTypes.length - 1 && <ChevronRight size={12} className="text-gray-400" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Skill Type Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{categoryIcons[currentCategory]}</span>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {categoryDisplayNames[currentCategory]}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentSkillType.skillType}</h2>
            <p className="text-gray-600">{currentSkillType.description}</p>
          </div>

          {/* Current Option */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{currentOption.name}</h3>
                <p className="text-gray-600 text-sm">{currentOption.question}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{currentAnswer}/10</div>
                <div className="text-xs text-gray-500 mt-1">
                  Option {currentOptionIndex + 1} of {currentSkillType.options.length}
                </div>
              </div>
            </div>

            {/* Rating Slider */}
            <div className="mb-6">
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

            {/* Quick Rating Buttons */}
            <div className="grid grid-cols-10 gap-2 mb-6">
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

            {/* Options List for Current Skill Type */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">All options in {currentSkillType.skillType}:</p>
              <div className="flex flex-wrap gap-2">
                {currentSkillType.options.map((option, idx) => {
                  const optRatingKey = `${currentCategory}-${currentSkillType.id}-${option.id}`;
                  const optRating = answers[optRatingKey];
                  const isCurrent = idx === currentOptionIndex;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setCurrentOptionIndex(idx)}
                      className={`px-3 py-1 rounded text-sm transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white font-semibold'
                          : optRating !== undefined
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option.name} {optRating !== undefined && `(${optRating})`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentCategoryIndex === 0 && currentSkillTypeIndex === 0 && currentOptionIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
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

            <div className="flex items-center gap-3">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                {currentCategoryIndex === categories.length - 1 &&
                currentSkillTypeIndex === skillTypes.length - 1 &&
                currentOptionIndex === currentSkillType.options.length - 1
                  ? 'Complete Assessment'
                  : currentOptionIndex === currentSkillType.options.length - 1
                  ? 'Next Skill Type'
                  : 'Next Option'}
                <ArrowRight size={20} />
              </button>
              
              {/* Allow completing assessment at any time */}
              {Object.keys(answers).length > 0 && (
                <button
                  onClick={handleComplete}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm"
                  title="Complete assessment with current progress (you can skip remaining items)"
                >
                  Complete Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

