import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute component for guarding routes based on user roles
 * Redirects unauthorized users to home page
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles that can access this route
 * @param {string} [props.redirectTo='/'] - Where to redirect if unauthorized
 */
export const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectTo = "/login",
}) => {
  // Get current user from localStorage
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  // 1. Check if user exists (Authentication)
  if (!user || !user.documentId) {
    return <Navigate to={redirectTo} replace />;
  }

  // 2. Check if user's role is in the allowed roles (Authorization)
  // If allowedRoles is empty, it means any authenticated user is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.user_role)) {
    // If authenticated but wrong role, send to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
