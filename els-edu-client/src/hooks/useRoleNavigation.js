import { useMemo } from "react";
import { NAVIGATION_BY_ROLE, canAccessNavItem } from "../utils/constants";

/**
 * Custom hook for role-based navigation
 * Provides utilities to check navigation access and get role-specific routes
 */
export const useRoleNavigation = () => {
  // Get current user from localStorage
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userRole = storedUser?.user_role || "STUDENT";
  const userOrg = storedUser?.org;

  /**
   * Check if current user can access a navigation item
   * @param {string} navItem - Navigation item identifier (e.g., 'dashboard', 'manage')
   * @returns {boolean}
   */
  const canAccess = (navItem) => {
    return canAccessNavItem(userRole, navItem);
  };

  /**
   * Get the appropriate route for the Manage tab based on role
   * - SUPERADMIN: goes to /manage (full management page)
   * - ADMIN: goes to /admin/org/{their-org-documentId} (their org's page)
   * @returns {string} Route path
   */
  const getManageRoute = () => {
    if (userRole === "SUPERADMIN") {
      return "/manage";
    }

    // For ADMIN, navigate to their org's management page
    if (userRole === "ADMIN" && userOrg) {
      const orgDocumentId = userOrg.documentId || userOrg;
      return `/admin/org/${orgDocumentId}`;
    }

    // Fallback
    return "/";
  };

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Array of role names
   * @returns {boolean}
   */
  const hasAnyRole = (roles) => {
    return roles.includes(userRole);
  };

  /**
   * Get all navigation items the current user can access
   * @returns {string[]}
   */
  const getAccessibleNavItems = () => {
    return NAVIGATION_BY_ROLE[userRole] || NAVIGATION_BY_ROLE["STUDENT"];
  };

  return {
    userRole,
    userOrg,
    canAccess,
    getManageRoute,
    hasAnyRole,
    getAccessibleNavItems,
  };
};

export default useRoleNavigation;
