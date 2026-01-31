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
      return response.data?.data || response.data;
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
      return response.data?.data || response.data;
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
      return response.data?.data || response.data || [];
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
      return response.data?.data || response.data || [];
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
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching skills:", error);
      return [];
    }
  },

  submitSurvey: async (surveyData) => {
    try {
      const response = await axios.post(
        `${API_URL}/analytics/survey`,
        surveyData,
        {
          headers: getHeaders(),
        },
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error submitting survey:", error);
      throw error;
    }
  },

  getMockAnalytics: (grade) => {
    return {
      stats: {
        totalQuizzes: 12,
        averageScore: 78,
        activeCourses: 3,
        completedCourses: 5,
      },
      charts: {
        skillRadar: [
          { skill: "Problem Solving", score: 80, fullMark: 100 },
          { skill: "Critical Thinking", score: 65, fullMark: 100 },
          { skill: "Communication", score: 90, fullMark: 100 },
          { skill: "Creativity", score: 75, fullMark: 100 },
          { skill: "Collaboration", score: 85, fullMark: 100 },
        ],
        progressHistory: [
          { date: "Jan", score: 65 },
          { date: "Feb", score: 70 },
          { date: "Mar", score: 75 },
          { date: "Apr", score: 72 },
          { date: "May", score: 80 },
        ],
        activityHeatmap: Array(30)
          .fill(0)
          .map((_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            count: Math.floor(Math.random() * 5),
          })),
      },
      insights: {
        recommendations: [
          {
            type: "Course",
            title: "Advanced Mathematics",
            reason: "Based on your strong problem solving skills",
            link: "/courses/math-adv",
          },
          {
            type: "Project",
            title: "Science Fair 2024",
            reason: "Great for applying critical thinking",
            link: "/projects/science-fair",
          },
        ],
      },
    };
  },

  // --- Methods for School/College Survey Flows ---

  /**
   * Get academic subjects for school surveys
   * @param {Object} params - { categories, search, page, limit }
   */
  getAcademicSubjects: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.categories && params.categories.length > 0) {
        queryParams.set("categories", params.categories.join(","));
      }
      if (params.search) queryParams.set("search", params.search);
      if (params.page) queryParams.set("page", params.page.toString());
      if (params.limit) queryParams.set("limit", params.limit.toString());

      const response = await axios.get(
        `${API_URL}/analytics/subjects?${queryParams}`,
        { headers: getHeaders() },
      );
      return response.data || { data: [], pagination: { hasMore: false } };
    } catch (error) {
      console.error("Error fetching academic subjects:", error);
      return { data: [], pagination: { hasMore: false } };
    }
  },

  /**
   * Get learning path skills for college surveys
   * @param {Object} params - { learningPaths, search, page, limit }
   */
  getLearningPathSkills: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.learningPaths && params.learningPaths.length > 0) {
        queryParams.set("learningPaths", params.learningPaths.join(","));
      }
      if (params.search) queryParams.set("search", params.search);
      if (params.page) queryParams.set("page", params.page.toString());
      if (params.limit) queryParams.set("limit", params.limit.toString());

      const response = await axios.get(
        `${API_URL}/analytics/learning-skills?${queryParams}`,
        { headers: getHeaders() },
      );
      return response.data || { data: [], pagination: { hasMore: false } };
    } catch (error) {
      console.error("Error fetching learning path skills:", error);
      return { data: [], pagination: { hasMore: false } };
    }
  },

  /**
   * Seed survey data (subjects and skills) - for development
   */
  seedSurveyData: async () => {
    try {
      const response = await axios.post(
        `${API_URL}/analytics/seed-survey-data`,
        {},
        { headers: getHeaders() },
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error seeding survey data:", error);
      throw error;
    }
  },
};

// Named exports for quiz-related functions
export const getQuizTopics = async (skillNames) => {
  try {
    const skills = Array.isArray(skillNames)
      ? skillNames.join(",")
      : skillNames;
    const response = await axios.get(
      `${API_URL}/analytics/quiz/topics?skills=${encodeURIComponent(skills)}`,
      { headers: getHeaders() },
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching quiz topics:", error);
    throw error;
  }
};

export const getQuizQuestions = async (
  topicIds,
  perTopic = 5,
  level = null,
) => {
  try {
    const topicIdsParam = Array.isArray(topicIds)
      ? topicIds.join(",")
      : topicIds;
    const params = new URLSearchParams({
      topicIds: topicIdsParam,
      perTopic: perTopic.toString(),
    });

    if (level) {
      params.append("level", level.toString());
    }

    const response = await axios.get(
      `${API_URL}/analytics/quiz/questions?${params}`,
      { headers: getHeaders() },
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    throw error;
  }
};

export default analyticsService;
