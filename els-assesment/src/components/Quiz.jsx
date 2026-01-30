import { useAuth } from '../contexts/AuthContext';
import { useSelfAssessment } from '../contexts/SelfAssessmentContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function Quiz() {
  const { user } = useAuth();
  const { selfAssessmentResults } = useSelfAssessment();
  const navigate = useNavigate();
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Initialize quiz questions if needed
    initializeQuizQuestions();
    
    // Load available quizzes based on self-assessment
    loadAvailableQuizzes();
  }, [user, selfAssessmentResults]);

  const initializeQuizQuestions = async () => {
    try {
      const result = await api.initializeQuizQuestions();
      console.log('Quiz questions initialization:', result);
      // If no questions were inserted, check if they exist
      if (result.inserted === 0 && result.skipped === 0) {
        console.warn('No quiz questions found. They may need to be initialized.');
      }
    } catch (error) {
      console.error('Failed to initialize quiz questions:', error);
      // Don't show error to user, questions might already be initialized
    }
  };

  const loadAvailableQuizzes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get categories from self-assessment results
      const categories = selfAssessmentResults?.selfAssessment 
        ? Object.keys(selfAssessmentResults.selfAssessment)
        : ['development', 'testing', 'devops', 'agentic-ai', 'mobile-app'];

      const quizList = [];
      
      for (const category of categories) {
        try {
          // Check if questions exist for this category
          const questions = await api.getQuizQuestionsByCategory(category, null, null);
          
          console.log(`Loaded ${questions?.length || 0} questions for category: ${category}`);
          
          if (questions && questions.length > 0) {
            // Get category score from self-assessment
            const categoryScore = selfAssessmentResults?.selfAssessment?.[category];
            const avgScore = categoryScore 
              ? Object.values(categoryScore).reduce((sum, val) => sum + (val || 0), 0) / Object.keys(categoryScore).length
              : 0;

            // Determine eligibility (score >= 6.0 or no self-assessment yet)
            const eligible = !selfAssessmentResults || avgScore >= 6.0;

            // Map category names
            const categoryMap = {
              'development': 'Development',
              'testing': 'Testing',
              'devops': 'DevOps',
              'agentic-ai': 'Agentic AI',
              'mobile-app': 'Mobile App',
            };

            // Count questions by skill type
            const skillTypeCounts = {};
            questions.forEach(q => {
              skillTypeCounts[q.skillType] = (skillTypeCounts[q.skillType] || 0) + 1;
            });

            const totalQuestions = questions.length;
            const estimatedMinutes = Math.ceil(totalQuestions * 1.2); // ~1.2 min per question

            quizList.push({
              id: category,
              category: categoryMap[category] || category,
              categoryKey: category,
              title: `${categoryMap[category] || category} Quiz`,
              description: `Test your knowledge in ${categoryMap[category] || category.toLowerCase()}. Questions cover multiple skill areas.`,
              duration: `${estimatedMinutes} minutes`,
              questions: totalQuestions,
              difficulty: avgScore >= 7 ? 'Advanced' : avgScore >= 5 ? 'Intermediate' : 'Beginner',
              eligible,
              avgScore: avgScore.toFixed(1),
            });
          } else {
            console.warn(`No questions found for category: ${category}`);
          }
        } catch (error) {
          console.error(`Error loading questions for ${category}:`, error);
          // Continue to next category even if one fails
        }
      }

      if (quizList.length === 0) {
        console.warn('No quizzes available. Questions may need to be initialized.');
        setError('No quiz questions found. Please ensure quiz questions are initialized in the database. You can try refreshing the page.');
      }

      setAvailableQuizzes(quizList);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
      setError(`Failed to load available quizzes: ${error.message || 'Unknown error'}. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async (quiz) => {
    if (!quiz.eligible) {
      alert('Please complete your self-assessment and score 6.0 or higher in this category to unlock this quiz.');
      return;
    }

    try {
      // Get self-assessment results to determine which skill types to focus on
      const categoryResults = selfAssessmentResults?.selfAssessment?.[quiz.categoryKey] || {};
      
      // Get skill types from self-assessment that have scores
      const skillTypes = Object.keys(categoryResults).filter(
        key => categoryResults[key] && categoryResults[key] > 0
      );

      // Create quiz session
      const sessionData = {
        user_id: user._id || user.id,
        category: quiz.categoryKey,
        difficulty: null, // Get questions of all difficulty levels
        skillType: null, // Get questions from all skill types
        questionCount: Math.min(quiz.questions, 20), // Limit to 20 questions per quiz
      };

      console.log('Creating quiz session with data:', sessionData);
      const session = await api.createQuizSession(sessionData);
      console.log('Quiz session created:', session);
      
      // Handle both _id and id fields
      const sessionId = session?.id || session?._id;
      
      if (!session || !sessionId) {
        throw new Error('Session creation failed: No session ID returned');
      }
      
      // Navigate to quiz taking page
      navigate(`/quiz/take/${sessionId}`, { state: { quiz, session } });
    } catch (error) {
      console.error('Failed to start quiz:', error);
      const errorMessage = error.message || 'Failed to start quiz. Please try again.';
      alert(errorMessage);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading available quizzes...</p>
        </div>
      </div>
    );
  }

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
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Available Quizzes</h1>
          <p className="text-gray-600 text-lg">
            Test your knowledge and track your progress across different skill categories
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!selfAssessmentResults && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <strong>Note:</strong> Complete your self-assessment first to get personalized quiz recommendations based on your skill levels.
            </p>
          </div>
        )}

        {/* Quiz Cards */}
        {availableQuizzes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Quizzes Available</h3>
            <p className="text-gray-600">
              Quiz questions are being set up. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  quiz.eligible
                    ? 'border-green-300 hover:shadow-lg transition-shadow'
                    : 'border-gray-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-blue-600" size={24} />
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {quiz.category}
                    </span>
                  </div>
                  {quiz.eligible ? (
                    <CheckCircle2 className="text-green-600" size={20} />
                  ) : (
                    <Clock className="text-gray-400" size={20} />
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{quiz.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>

                {selfAssessmentResults && quiz.avgScore && (
                  <div className="mb-3 p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">
                      Your Self-Assessment Score: <span className="font-semibold">{quiz.avgScore}/10</span>
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{quiz.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen size={16} />
                    <span>{quiz.questions} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartQuiz(quiz)}
                  disabled={!quiz.eligible}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    quiz.eligible
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {quiz.eligible ? 'Start Quiz' : 'Not Eligible Yet'}
                </button>

                {!quiz.eligible && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Score 6.0+ in self-assessment to unlock
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">📝 Quiz Information</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Quizzes are personalized based on your self-assessment results</li>
            <li>• Each quiz is timed and must be completed in one session</li>
            <li>• Your results will be saved and visible in your dashboard</li>
            <li>• You can retake quizzes to improve your scores</li>
            <li>• Questions are selected from skill areas you've assessed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
