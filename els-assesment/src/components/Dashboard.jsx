import { AssessmentEngine } from './AssessmentEngine';
import { useAuth } from '../contexts/AuthContext';
import { useSelfAssessment } from '../contexts/SelfAssessmentContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { LogOut, User, LayoutDashboard, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isCompleted: selfAssessmentCompleted } = useSelfAssessment();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
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

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <LayoutDashboard size={18} />
                  <span className="font-medium">Dashboard</span>
                </div>
                <Link
                  to="/self-assessment"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Self-Assessment
                </Link>
                <Link
                  to="/quiz"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Quiz
                </Link>
              </div>

              {/* User Info and Logout */}
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User size={18} />
                  <span className="font-medium">{user.name}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 text-xs">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Self-Assessment Completion Banner */}
      {selfAssessmentCompleted && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600" size={24} />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Self-Assessment Completed!
                  </p>
                  <p className="text-xs text-green-700">
                    Your assessment results are now available. Proceed to take the quiz.
                  </p>
                </div>
              </div>
              <Link
                to="/quiz"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Go to Quiz
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="py-8 px-4">
        <AssessmentEngine />
      </div>
    </div>
  );
}

