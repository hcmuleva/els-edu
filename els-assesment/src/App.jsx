import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SelfAssessmentProvider } from './contexts/SelfAssessmentContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Quiz from './components/Quiz';
import QuizTaking from './components/QuizTaking';
import QuizResults from './components/QuizResults';
import SelfAssessment from './components/EnhancedSelfAssessment';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SelfAssessmentProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/self-assessment"
              element={
                <ProtectedRoute>
                  <SelfAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/take/:sessionId"
              element={
                <ProtectedRoute>
                  <QuizTaking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/results/:sessionId"
              element={
                <ProtectedRoute>
                  <QuizResults />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </SelfAssessmentProvider>
    </AuthProvider>
  );
}

export default App;

