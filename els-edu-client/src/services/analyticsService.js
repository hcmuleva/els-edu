import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

const getHeaders = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("jwt"); // Fallback check
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const analyticsService = {
  getStudentDashboard: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/analytics/dashboard/student`,
        {
          headers: getHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student dashboard:", error);
      throw error;
    }
  },

  getTeacherDashboard: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/analytics/dashboard/teacher`,
        {
          headers: getHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching teacher dashboard:", error);
      throw error;
    }
  },

  getParentDashboard: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/analytics/dashboard/parent`,
        {
          headers: getHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching parent dashboard:", error);
      throw error;
    }
  },

  linkChild: async (childDocumentId) => {
    try {
      const response = await axios.post(
        `${API_URL}/analytics/dashboard/parent/link-child`,
        { childDocumentId },
        { headers: getHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error("Error linking child:", error);
      throw error;
    }
  },

  getSurveyResults: async (params = {}) => {
    try {
      // Serialize params if needed, or pass as query params
      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(
        `${API_URL}/analytics/survey-results?${queryString}`,
        {
          headers: getHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching survey results:", error);
      throw error;
    }
  },

  getQuizResults: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(
        `${API_URL}/analytics/quiz-results?${queryString}`,
        {
          headers: getHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.warn("Error fetching analytics quiz results:", error);
      return { quizzes: [] };
    }
  },

  // --- Methods for SelfAssessmentPage ---

  getCompanies: async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/companies`, {
        headers: getHeaders(),
      });
      return response.data || [];
    } catch (error) {
      console.error("Error fetching companies:", error);
      return [];
    }
  },

  getRoles: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(
        `${API_URL}/analytics/roles?${queryString}`,
        {
          headers: getHeaders(),
        },
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  },

  getSkills: async (role, company) => {
    try {
      const params = new URLSearchParams({ role, company }).toString();
      const response = await axios.get(
        `${API_URL}/analytics/skills?${params}`,
        {
          headers: getHeaders(),
        },
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching skills:", error);
      return [];
    }
  },

  submitSurvey: async (surveyData) => {
    try {
      const response = await axios.post(
        `${API_URL}/analytics/submit-survey`,
        surveyData,
        {
          headers: getHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting survey:", error);
      throw error;
    }
  },
};

export default analyticsService;
