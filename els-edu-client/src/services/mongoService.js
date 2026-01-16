import api from "./api";
import qs from "qs";

const mongoService = {
  // --- Classrooms ---
  getClassrooms: async (params = {}) => {
    // Handling direct query string or object params
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(`/mongo-studio/classrooms?${queryString}`);
    return response.data;
  },

  createClassroom: async (data) => {
    const response = await api.post("/mongo-studio/classrooms", data);
    return response.data;
  },

  updateClassroom: async (id, data) => {
    const response = await api.put(`/mongo-studio/classrooms/${id}`, data);
    return response.data;
  },

  deleteClassroom: async (documentId) => {
    const response = await api.delete(`/mongo-studio/classrooms/${documentId}`);
    return response.data;
  },

  // --- Assignments ---
  getAssignments: async (params = {}) => {
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(`/assignments?${queryString}`);
    return response.data;
  },

  getAssignmentById: async (id) => {
    // Assuming Strapi endpoint for single assignment
    const response = await api.get(`/assignments/${id}?populate=*`);
    return response.data;
  },

  // --- User Assignments (Submissions) ---
  getUserAssignments: async (params = {}) => {
    const queryString = qs.stringify(params, { encodeValuesOnly: true });
    const response = await api.get(`/user-assignments?${queryString}`);
    return response.data;
  },

  createUserAssignment: async (data) => {
    const response = await api.post(`/user-assignments`, { data });
    return response.data;
  },

  updateUserAssignment: async (id, data) => {
    const response = await api.put(`/user-assignments/${id}`, { data });
    return response.data;
  },

  deleteUserAssignment: async (id) => {
    const response = await api.delete(`/user-assignments/${id}`);
    return response.data;
  },

  createAssignment: async (data, isV3 = true) => {
    // Strapi standard creation expects { data: { ... } }
    const response = await api.post("/assignments", { data });
    return response.data;
  },

  updateAssignment: async (documentId, data) => {
    // Strapi standard update expects { data: { ... } }
    const response = await api.put(`/assignments/${documentId}`, { data });
    return response.data;
  },

  deleteAssignment: async (documentId) => {
    const response = await api.delete(`/assignments/${documentId}`);
    return response.data;
  },

  // --- Metadata (Orgs, Subjects, Topics) ---
  getOrgs: async () => {
    const response = await api.get("/orgs?pagination[pageSize]=100");
    return response.data;
  },

  getSubjects: async () => {
    const response = await api.get("/subjects?pagination[pageSize]=100");
    return response.data;
  },

  getTopics: async () => {
    const response = await api.get("/topics?pagination[pageSize]=100");
    return response.data;
  },

  // --- Contents ---
  getContents: async (params = {}) => {
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(`/contents?${queryString}`);
    return response.data;
  },

  // --- User Surveys ---
  getUserSurveys: async (params = {}) => {
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(`/mongo-studio/usersurveys?${queryString}`);
    return response.data;
  },

  createUserSurvey: async (data) => {
    const response = await api.post("/mongo-studio/usersurveys", data);
    return response.data;
  },

  updateUserSurvey: async (id, data) => {
    const response = await api.put(`/mongo-studio/usersurveys/${id}`, data);
    return response.data;
  },

  deleteUserSurvey: async (id) => {
    const response = await api.delete(`/mongo-studio/usersurveys/${id}`);
    return response.data;
  },

  // --- User Quizzes ---
  getUserQuizzes: async (params = {}) => {
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(`/mongo-studio/userquizzes?${queryString}`);
    return response.data;
  },

  createUserQuiz: async (data) => {
    const response = await api.post("/mongo-studio/userquizzes", data);
    return response.data;
  },

  updateUserQuiz: async (id, data) => {
    const response = await api.put(`/mongo-studio/userquizzes/${id}`, data);
    return response.data;
  },

  deleteUserQuiz: async (id) => {
    const response = await api.delete(`/mongo-studio/userquizzes/${id}`);
    return response.data;
  },

  // --- User Custom Courses ---
  getUserCustomCourses: async (params = {}) => {
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(
      `/mongo-studio/userCustomCourses?${queryString}`
    );
    return response.data;
  },

  createUserCustomCourse: async (data) => {
    const response = await api.post("/mongo-studio/userCustomCourses", data);
    return response.data;
  },

  updateUserCustomCourse: async (id, data) => {
    const response = await api.put(
      `/mongo-studio/userCustomCourses/${id}`,
      data
    );
    return response.data;
  },

  deleteUserCustomCourse: async (id) => {
    const response = await api.delete(`/mongo-studio/userCustomCourses/${id}`);
    return response.data;
  },

  // --- Companies ---
  getCompanies: async (params = {}) => {
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(`/mongo-studio/companies?${queryString}`);
    return response.data;
  },

  createCompany: async (data) => {
    const response = await api.post("/mongo-studio/companies", data);
    return response.data;
  },

  updateCompany: async (id, data) => {
    const response = await api.put(`/mongo-studio/companies/${id}`, data);
    return response.data;
  },

  deleteCompany: async (id) => {
    const response = await api.delete(`/mongo-studio/companies/${id}`);
    return response.data;
  },

  // --- Domains ---
  getDomains: async (params = {}) => {
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(`/mongo-studio/domains?${queryString}`);
    return response.data;
  },

  createDomain: async (data) => {
    const response = await api.post("/mongo-studio/domains", data);
    return response.data;
  },

  updateDomain: async (id, data) => {
    const response = await api.put(`/mongo-studio/domains/${id}`, data);
    return response.data;
  },

  deleteDomain: async (id) => {
    const response = await api.delete(`/mongo-studio/domains/${id}`);
    return response.data;
  },

  // --- Roles ---
  getRoles: async (params = {}) => {
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(`/mongo-studio/roles?${queryString}`);
    return response.data;
  },

  createRole: async (data) => {
    const response = await api.post("/mongo-studio/roles", data);
    return response.data;
  },

  updateRole: async (id, data) => {
    const response = await api.put(`/mongo-studio/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id) => {
    const response = await api.delete(`/mongo-studio/roles/${id}`);
    return response.data;
  },

  // --- Skills ---
  getSkills: async (params = {}) => {
    const queryString = qs.stringify(params, { encode: false });
    const response = await api.get(`/mongo-studio/skills?${queryString}`);
    return response.data;
  },

  createSkill: async (data) => {
    const response = await api.post("/mongo-studio/skills", data);
    return response.data;
  },

  updateSkill: async (id, data) => {
    const response = await api.put(`/mongo-studio/skills/${id}`, data);
    return response.data;
  },

  deleteSkill: async (id) => {
    const response = await api.delete(`/mongo-studio/skills/${id}`);
    return response.data;
  },
};

export default mongoService;
