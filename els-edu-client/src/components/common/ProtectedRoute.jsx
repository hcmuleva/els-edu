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
  redirectTo = "/",
}) => {
  // Get current user from localStorage
  let userRole = "STUDENT";
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    userRole = storedUser?.user_role || "STUDENT";
  } catch {
    userRole = "STUDENT";
  }

  // Check if user's role is in the allowed roles
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
