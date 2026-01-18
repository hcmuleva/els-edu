/**
 * Classroom Service
 * Handles API calls for classrooms, assignments, and notifications
 * Uses axios instance from api.js
 */

import api from "./api";

const classroomService = {
  /**
   * @param {string} orgDocumentId
   * @param {string} grade
   * @param {string} userDocumentId - Optional, for fetching progress-based status
   * @returns {Promise<Array>} List of classrooms
   */
  getClassrooms: async (orgDocumentId, grade = null, userDocumentId = null) => {
    if (!orgDocumentId) return [];

    let params = { orgDocumentId };
    if (grade) {
      params.grade = grade;
    }
    if (userDocumentId) {
      params.userDocumentId = userDocumentId;
    }

    try {
      const response = await api.get("/mongo-studio/classrooms", { params });
      // Strapi returns { data: [...] } in the body.
      // Axios puts the body in response.data.
      return response.data?.data || [];
    } catch (error) {
      console.error("[ClassroomService] getClassrooms error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Fetch user assignments
   * @param {string} orgDocumentId
   * @param {string} userDocumentId
   * @param {string} status
   * @returns {Promise<Array>} List of assignments
   */
  getUserAssignments: async (orgDocumentId, userDocumentId, status = null) => {
    if (!orgDocumentId || !userDocumentId) return [];

    let params = { orgDocumentId, userDocumentId };
    if (status) {
      params.status = status;
    }

    try {
      const response = await api.get("/mongo-studio/userAssignments", {
        params,
      });
      return response.data?.data || [];
    } catch (error) {
      console.error("[ClassroomService] getUserAssignments error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Fetch notifications
   * @param {string} orgDocumentId
   * @param {string} userDocumentId
   * @param {object} options
   * @returns {Promise<Array>} List of notifications
   */
  getNotifications: async (orgDocumentId, userDocumentId, options = {}) => {
    if (!orgDocumentId || !userDocumentId) return [];

    const {
      page = 1,
      perPage = 20,
      sortField = "createdAt",
      sortOrder = "desc",
    } = options;

    const params = {
      orgDocumentId,
      userDocumentId,
      sortField,
      sortOrder,
      page,
      perPage,
    };

    try {
      const response = await api.get("/mongo-studio/notifications", { params });
      return response.data?.data || [];
    } catch (error) {
      console.error("[ClassroomService] getNotifications error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Mark notification as read
   * @param {string} id
   */
  markNotificationRead: async (id) => {
    try {
      const response = await api.put(`/mongo-studio/notifications/${id}`, {
        isRead: true,
      });
      return response.data;
    } catch (error) {
      console.error("[ClassroomService] markNotificationRead error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete notification
   * @param {string} id
   */
  deleteNotification: async (id) => {
    try {
      await api.delete(`/mongo-studio/notifications/${id}`);
      return true;
    } catch (error) {
      console.error("[ClassroomService] deleteNotification error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single classroom details
   * @param {string} id
   */
  getClassroom: async (id) => {
    try {
      const response = await api.get(`/mongo-studio/classrooms/${id}`);
      return response.data;
    } catch (error) {
      console.error("[ClassroomService] getClassroom error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get class progress
   * @param {string} classroomId
   * @param {string} userDocumentId
   */
  getClassProgress: async (classroomId, userDocumentId) => {
    try {
      const response = await api.get(`/mongo-studio/classProgress`, {
        params: { classroomId, userDocumentId },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error("[ClassroomService] getClassProgress error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Create class progress
   * @param {object} data
   */
  createClassProgress: async (data) => {
    try {
      const response = await api.post("/mongo-studio/classProgress", data);
      return response.data;
    } catch (error) {
      // If duplicate key error (progress already exists), fetch and return it
      if (
        error.response?.status === 500 &&
        error.response?.data?.error?.includes("duplicate key")
      ) {
        console.log(
          "[ClassroomService] ClassProgress already exists, fetching it...",
        );
        try {
          const existingProgress = await api.get(
            "/mongo-studio/classProgress",
            {
              params: {
                classroomId: data.classroomId,
                userDocumentId: data.userDocumentId,
              },
            },
          );
          return existingProgress.data?.data?.[0] || existingProgress.data;
        } catch (fetchError) {
          console.error(
            "[ClassroomService] Failed to fetch existing progress:",
            fetchError,
          );
          throw fetchError;
        }
      }
      console.error("[ClassroomService] createClassProgress error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update class progress
   * @param {string} id
   * @param {object} data
   */
  updateClassProgress: async (id, data) => {
    try {
      const response = await api.put(`/mongo-studio/classProgress/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("[ClassroomService] updateClassProgress error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get content details
   * @param {string} documentId
   */
  getContent: async (documentId) => {
    try {
      const response = await api.get("/contents", {
        params: {
          "filters[documentId][$eq]": documentId,
          populate: "*",
        },
      });
      // Strapi response structure: { data: [ ... ], meta: ... }
      return response.data?.data?.[0] || null;
    } catch (error) {
      console.error("[ClassroomService] getContent error:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get assignments for a specific classroom
   * @param {string} orgDocumentId
   * @param {string} grade - The grade of the classroom
   * @returns {Promise<Array>} List of assignments for this class
   */
  getClassroomAssignments: async (orgDocumentId, grade) => {
    if (!orgDocumentId || !grade) return [];

    try {
      const response = await api.get("/mongo-studio/userAssignments", {
        params: {
          orgDocumentId,
          grade,
        },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error("[ClassroomService] getClassroomAssignments error:", error);
      throw error.response?.data || error;
    }
  },
};

export default classroomService;
