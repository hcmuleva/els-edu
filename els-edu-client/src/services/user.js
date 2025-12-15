// services/user.js
import api from "./api";

/**
 * Fetch aggregated user statistics
 * (Total Users, Role Distribution, Status Counts)
 */
export const getUserStats = async () => {
  try {
    const response = await api.get("/user/stats");
    // Axios wraps response in 'data' prop. 
    // If backend sends { totalUsers: ... }, it will be in response.data
    return response.data;
  } catch (err) {
    throw (
      err.response?.data || {
        message: err.message || "Failed to fetch user stats.",
      }
    );
  }
};

/**
 * Example: Fetch all users (if needed outside react-admin)
 */
export const getAllUsers = async (params = {}) => {
  try {
    const response = await api.get("/users", { params });
    return response.data;
  } catch (err) {
    throw err;
  }
};
