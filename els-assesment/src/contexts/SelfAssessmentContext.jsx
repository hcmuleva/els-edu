import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { aggregateSelfAssessment } from '../lib/enhancedSelfAssessmentQuestions';

const SelfAssessmentContext = createContext(null);

export function SelfAssessmentProvider({ children }) {
  const { user } = useAuth();
  const [selfAssessmentResults, setSelfAssessmentResults] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load from API on mount if user is logged in
  useEffect(() => {
    const loadFromStorage = () => {
      const stored = localStorage.getItem('els_self_assessment');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setSelfAssessmentResults(data);
          setIsCompleted(data.completed || false);
        } catch (e) {
          localStorage.removeItem('els_self_assessment');
        }
      }
    };

    if (user && user._id) {
      // Try to load from API
      loadFromAPI(user._id).catch(() => {
        // Fallback to localStorage if API fails
        loadFromStorage();
      });
    } else {
      // Fallback to localStorage if no user
      loadFromStorage();
    }
  }, [user]);

  const loadFromAPI = async (userId) => {
    try {
      setIsLoading(true);
      const result = await api.getSelfAssessmentResult(userId);
      if (result && result.aggregatedResults) {
        // Convert API result to expected format
        const userProfile = {
          name: user?.name || 'User',
          background: 'student',
          yearsOfExperience: 0,
          selfAssessment: result.aggregatedResults,
        };
        setSelfAssessmentResults(userProfile);
        setIsCompleted(result.completed || false);
        localStorage.setItem('els_self_assessment', JSON.stringify(userProfile));
      }
    } catch (error) {
      // 404 is expected for new users who haven't completed assessment yet
      // Only log other errors
      if (!error.message.includes('404') && !error.message.includes('not found')) {
        console.error('Failed to load self-assessment from API:', error);
      }
      // Silently fall back to localStorage - this is normal for new users
    } finally {
      setIsLoading(false);
    }
  };

  const saveSelfAssessment = async (results) => {
    if (!user || !user._id) {
      // Fallback to localStorage if no user
      const data = {
        ...results,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      setSelfAssessmentResults(data);
      setIsCompleted(true);
      localStorage.setItem('els_self_assessment', JSON.stringify(data));
      return;
    }

    try {
      setIsLoading(true);
      
      // Extract detailed ratings if available, otherwise use aggregated
      let detailedRatings = {};
      let aggregatedResults = results.selfAssessment || {};

      // If results have detailed ratings in a different format, extract them
      // For now, we'll use the aggregated results
      if (results.detailedRatings) {
        detailedRatings = results.detailedRatings;
      }

      // Save to API
      const resultData = {
        user_id: user._id,
        detailedRatings,
        aggregatedResults,
      };

      await api.saveSelfAssessmentResult(resultData);

      // Update local state
      const data = {
        ...results,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      setSelfAssessmentResults(data);
      setIsCompleted(true);
      localStorage.setItem('els_self_assessment', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save self-assessment to API:', error);
      // Fallback to localStorage
      const data = {
        ...results,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      setSelfAssessmentResults(data);
      setIsCompleted(true);
      localStorage.setItem('els_self_assessment', JSON.stringify(data));
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelfAssessment = () => {
    setSelfAssessmentResults(null);
    setIsCompleted(false);
    localStorage.removeItem('els_self_assessment');
  };

  return (
    <SelfAssessmentContext.Provider
      value={{
        selfAssessmentResults,
        isCompleted,
        isLoading,
        saveSelfAssessment,
        clearSelfAssessment,
      }}
    >
      {children}
    </SelfAssessmentContext.Provider>
  );
}

export function useSelfAssessment() {
  const context = useContext(SelfAssessmentContext);
  if (!context) {
    throw new Error('useSelfAssessment must be used within SelfAssessmentProvider');
  }
  return context;
}

