/**
 * API Service for communicating with FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User endpoints
  async register(userData) {
    return this.request('/users/', {
      method: 'POST',
      body: userData,
    });
  }

  async login(email, password) {
    return this.request('/users/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  // Self-Assessment Question Structure endpoints
  async getSelfAssessments(category = null) {
    const endpoint = category 
      ? `/self-assessments/questions/category/${category}`
      : '/self-assessments/questions';
    return this.request(endpoint);
  }

  async createSelfAssessment(assessmentData) {
    return this.request('/self-assessments/questions', {
      method: 'POST',
      body: assessmentData,
    });
  }

  // Self-Assessment Result endpoints
  async saveSelfAssessmentResult(resultData) {
    return this.request('/self-assessments/results', {
      method: 'POST',
      body: resultData,
    });
  }

  async getSelfAssessmentResult(userId) {
    try {
      const result = await this.request(`/self-assessments/results/user/${userId}`);
      // Check if result has the message field (no results found)
      if (result && result.message && result.message.includes('No self-assessment')) {
        return null;
      }
      return result;
    } catch (error) {
      // If 404, user doesn't have results yet - this is normal
      if (error.message.includes('404') || error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  async getSelfAssessmentResults(userId = null) {
    const endpoint = userId
      ? `/self-assessments/results?user_id=${userId}`
      : '/self-assessments/results';
    return this.request(endpoint);
  }

  async updateSelfAssessmentResult(resultId, updateData) {
    return this.request(`/self-assessments/results/${resultId}`, {
      method: 'PUT',
      body: updateData,
    });
  }

  // Quiz endpoints
  async initializeQuizQuestions() {
    return this.request('/init/quiz-questions', {
      method: 'POST',
    });
  }

  async getQuizQuestions(category = null, skillType = null, difficulty = null) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (skillType) params.append('skillType', skillType);
    if (difficulty) params.append('difficulty', difficulty);
    
    const queryString = params.toString();
    const endpoint = `/quiz/questions${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getQuizQuestionsByCategory(category, skillType = null, difficulty = null) {
    try {
      const params = new URLSearchParams();
      if (skillType) params.append('skillType', skillType);
      if (difficulty) params.append('difficulty', difficulty);
      
      const queryString = params.toString();
      const endpoint = `/quiz/questions/category/${category}${queryString ? `?${queryString}` : ''}`;
      const result = await this.request(endpoint);
      return result || [];
    } catch (error) {
      console.error(`Error fetching quiz questions for category ${category}:`, error);
      // Return empty array instead of throwing to allow graceful handling
      return [];
    }
  }

  async createQuizSession(sessionData) {
    return this.request('/quiz/sessions', {
      method: 'POST',
      body: sessionData,
    });
  }

  async getQuizSession(sessionId) {
    return this.request(`/quiz/sessions/${sessionId}`);
  }

  async submitQuizSession(sessionId, answers) {
    return this.request(`/quiz/sessions/${sessionId}/submit`, {
      method: 'POST',
      body: answers,
    });
  }

  async getUserQuizSessions(userId, category = null) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    
    const queryString = params.toString();
    const endpoint = `/quiz/sessions/user/${userId}${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }
}

export default new ApiService();

