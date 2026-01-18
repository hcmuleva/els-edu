import React from "react";
import { Navigate } from "react-router-dom";
import { DEFAULT_ORG_DOCUMENT_ID } from "../../utils/constants";

/**
 * ProtectedDefaultOrgRoute component for guarding routes to default org users only
 * Redirects non-default org users to my-subscriptions
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string} [props.redirectTo='/my-subscriptions'] - Where to redirect if not in default org
 */
export const ProtectedDefaultOrgRoute = ({
  children,
  redirectTo = "/my-subscriptions",
}) => {
  // Get current user from localStorage
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  // Check if user exists
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user belongs to default org
  const userOrgDocumentId = user.org?.documentId || user.org;
  const isDefaultOrg = userOrgDocumentId === DEFAULT_ORG_DOCUMENT_ID;

  if (!isDefaultOrg) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedDefaultOrgRoute;
