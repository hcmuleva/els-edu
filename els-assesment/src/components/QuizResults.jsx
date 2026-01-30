import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock, TrendingUp, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function QuizResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { result, quiz, timeSpent } = location.state || {};

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No results found.</p>
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

  const score = result.score || 0;
  const totalPoints = result.totalPoints || 0;
  const earnedPoints = Math.round((score / 100) * totalPoints);
  const percentage = score.toFixed(1);
  const isPassing = score >= 70;

  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = () => {
    if (score >= 90) return 'Excellent! Outstanding performance!';
    if (score >= 70) return 'Great job! You passed the quiz!';
    if (score >= 50) return 'Good effort! Keep practicing.';
    return 'Keep learning! Review the material and try again.';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            <button
              onClick={() => navigate('/quiz')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              <span>Back to Quizzes</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Score Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <div className={`text-6xl font-bold mb-4 ${getScoreColor()}`}>
            {percentage}%
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getScoreMessage()}
          </h2>
          <p className="text-gray-600 mb-6">
            You scored {earnedPoints} out of {totalPoints} points
          </p>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            {timeSpent && (
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Time: {formatTime(timeSpent)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              <span>{result.questions?.length || 0} questions</span>
            </div>
          </div>

          {isPassing ? (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
              <CheckCircle2 size={20} />
              <span className="font-semibold">Quiz Passed!</span>
            </div>
          ) : (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
              <XCircle size={20} />
              <span className="font-semibold">Keep Practicing</span>
            </div>
          )}
        </div>

        {/* Quiz Info */}
        {quiz && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quiz Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-lg font-semibold text-gray-900">{quiz.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Difficulty</p>
                <p className="text-lg font-semibold text-gray-900">{quiz.difficulty}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quiz')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Quizzes
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <TrendingUp size={20} />
            View Dashboard
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">📊 What's Next?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Your quiz results have been saved to your profile</li>
            <li>• Review your answers and explanations to improve</li>
            <li>• Continue practicing with more quizzes</li>
            <li>• Check your dashboard to see your progress over time</li>
            {!isPassing && (
              <li>• You can retake this quiz to improve your score</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

