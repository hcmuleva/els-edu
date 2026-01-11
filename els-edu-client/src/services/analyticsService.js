/**
 * Analytics API Service
 * Handles all analytics-related API calls
 */

// Use the same base URL as other services
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

/**
 * Get auth headers
 */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Get all companies
 */
export async function getCompanies() {
  const response = await fetch(`${API_URL}/analytics/companies`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  return result.data || [];
}

/**
 * Get all domains
 */
export async function getDomains() {
  const response = await fetch(`${API_URL}/analytics/domains`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  return result.data || [];
}

/**
 * Get roles by company and/or domain
 */
export async function getRoles(filters = {}) {
  const params = new URLSearchParams();
  if (filters.company) params.append("company", filters.company);
  if (filters.domain) params.append("domain", filters.domain);

  const response = await fetch(`${API_URL}/analytics/roles?${params}`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  return result.data || [];
}

/**
 * Get skills for a role
 */
export async function getSkills(role, company) {
  const params = new URLSearchParams();
  if (role) params.append("role", role);
  if (company) params.append("company", company);

  const response = await fetch(`${API_URL}/analytics/skills?${params}`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  return result.data || [];
}

/**
 * Submit survey
 */
export async function submitSurvey(surveyData) {
  const response = await fetch(`${API_URL}/analytics/survey`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(surveyData),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Failed to submit survey");
  return result.data;
}

/**
 * Get survey results
 */
export async function getSurveyResults() {
  const response = await fetch(`${API_URL}/analytics/survey-results`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  return result.data;
}

/**
 * Seed data (admin only)
 */
export async function seedData() {
  const response = await fetch(`${API_URL}/analytics/seed`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Failed to seed data");
  return result.data;
}

/**
 * Get quiz topics for skills
 */
export async function getQuizTopics(skills) {
  const skillsParam = Array.isArray(skills) ? skills.join(",") : skills;
  const response = await fetch(
    `${API_URL}/analytics/quiz/topics?skills=${encodeURIComponent(
      skillsParam
    )}`,
    { headers: getAuthHeaders() }
  );
  const result = await response.json();
  return result.data;
}

/**
 * Get quiz questions for topics
 */
export async function getQuizQuestions(topicIds, perTopic = 5) {
  const topicsParam = Array.isArray(topicIds) ? topicIds.join(",") : topicIds;
  const response = await fetch(
    `${API_URL}/analytics/quiz/questions?topicIds=${encodeURIComponent(
      topicsParam
    )}&perTopic=${perTopic}`,
    { headers: getAuthHeaders() }
  );
  const result = await response.json();
  return result.data;
}

/**
 * Submit quiz results
 */
export async function submitQuizResult(quizData) {
  const response = await fetch(`${API_URL}/analytics/quiz/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(quizData),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Failed to submit quiz");
  return result.data;
}

/**
 * Get quiz results
 */
export async function getQuizResults() {
  const response = await fetch(`${API_URL}/analytics/quiz/results`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  return result.data;
}
