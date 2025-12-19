import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const RoleContext = createContext(null);

export const useRoleContext = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRoleContext must be used within RoleProvider");
  }
  return context;
};

// Hook to get active role
export const useActiveRole = () => {
  const context = useRoleContext();
  return context.activeRole;
};

// Hook to get all available roles
export const useAvailableRoles = () => {
  const context = useRoleContext();
  return context.availableRoles;
};

// Hook to check permissions
export const usePermissions = () => {
  const context = useRoleContext();
  return {
    hasPermission: context.hasPermission,
    hasAnyPermission: context.hasAnyPermission,
    hasRole: context.hasRole,
    permissions: context.activeRole?.permissions || [],
    role: context.activeRole?.role,
  };
};

export const RoleProvider = ({ children }) => {
  const [availableRoles, setAvailableRoles] = useState([]);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to parse assigned_roles JSON field from user object
  const parseAssignedRoles = (assignedRoles, strapiRolePermissions = []) => {
    if (!assignedRoles) return [];

    try {
      // If it's a string, parse it
      let rolesArray = assignedRoles;
      if (typeof assignedRoles === "string") {
        rolesArray = JSON.parse(assignedRoles);
      }

      // Ensure it's an array
      if (!Array.isArray(rolesArray)) return [];

      // Map to role objects - assigned_roles can be [{role: "STUDENT"}, ...] or ["STUDENT", ...]
      return rolesArray.map((item, index) => ({
        id: index + 1,
        role: typeof item === "string" ? item : item?.role || "STUDENT",
        permissions: strapiRolePermissions, // Use permissions from Strapi's users-permissions role
        isActive: true,
      }));
    } catch (e) {
      console.error("Error parsing assigned_roles:", e);
      return [];
    }
  };

  // Helper to extract permissions from Strapi's users-permissions role
  const extractStrapiRolePermissions = (role) => {
    if (!role) return [];

    // Strapi role can have permissions in different formats
    // Format 1: role.permissions as array of objects
    if (Array.isArray(role.permissions)) {
      return role.permissions
        .map((p) => {
          if (typeof p === "string") return p;
          return p?.action || p?.name || p?.id || "";
        })
        .filter(Boolean);
    }

    // Format 2: role.permissions as object with controller keys
    if (role.permissions && typeof role.permissions === "object") {
      const perms = [];
      Object.entries(role.permissions).forEach(([controller, actions]) => {
        if (typeof actions === "object") {
          Object.entries(actions).forEach(([action, config]) => {
            if (config?.enabled) {
              perms.push(`${controller}.${action}`);
            }
          });
        }
      });
      return perms;
    }

    return [];
  };

  // Fallback: load roles from user's assigned_roles or user_role
  const loadRolesFromUser = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    try {
      const user = JSON.parse(userStr);

      // Extract permissions from Strapi's users-permissions role
      const strapiRolePermissions = extractStrapiRolePermissions(user.role);
      console.log("Strapi role:", user.role);
      console.log("Extracted permissions:", strapiRolePermissions);

      // First, try to use assigned_roles (JSON array)
      const assignedRolesArray = parseAssignedRoles(
        user.assigned_roles,
        strapiRolePermissions
      );

      if (assignedRolesArray.length > 0) {
        setAvailableRoles(assignedRolesArray);
        // Set active role based on user_role or first role
        const activeRoleName = user.user_role || assignedRolesArray[0]?.role;
        const matchingRole =
          assignedRolesArray.find((r) => r.role === activeRoleName) ||
          assignedRolesArray[0];
        setActiveRole(matchingRole);
        localStorage.setItem("activeRole", JSON.stringify(matchingRole));
      } else if (user.user_role) {
        // Fallback to user_role if no assigned_roles
        const roleObj = {
          id: 1,
          role: user.user_role,
          permissions: strapiRolePermissions,
          isActive: true,
        };
        setAvailableRoles([roleObj]);
        setActiveRole(roleObj);
        localStorage.setItem("activeRole", JSON.stringify(roleObj));
      }
    } catch (e) {
      console.error("Error loading roles from user:", e);
    }
  };

  // Load user roles from API
  const loadRoles = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all user roles from UserRole collection (not Strapi's built-in roles)
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:1337/api"
        }/user-roles/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // If 401/403, user might not be authenticated yet
        if (response.status === 401 || response.status === 403) {
          setLoading(false);
          return;
        }
        // If 404, user-roles endpoint doesn't exist, fall back to assigned_roles
        if (response.status === 404) {
          loadRolesFromUser();
          return;
        }
        throw new Error("Failed to fetch roles");
      }

      const { data: roles } = await response.json();
      setAvailableRoles(roles || []);

      // Get active role ID from localStorage or use first active role
      const storedActiveRoleId = localStorage.getItem("activeRoleId");
      let roleToSet = null;

      if (storedActiveRoleId && roles) {
        roleToSet = roles.find(
          (r) =>
            r.id === parseInt(storedActiveRoleId) ||
            r.documentId === storedActiveRoleId
        );
      }

      // If no stored role or stored role not found, use first active role or first role
      if (!roleToSet && roles && roles.length > 0) {
        roleToSet = roles.find((r) => r.isActive) || roles[0];
      }

      if (roleToSet) {
        setActiveRole(roleToSet);
        localStorage.setItem(
          "activeRoleId",
          roleToSet.id || roleToSet.documentId
        );
        // Store active role for authProvider compatibility
        localStorage.setItem("activeRole", JSON.stringify(roleToSet));
      } else {
        // Fallback to user's assigned_roles or user_role
        loadRolesFromUser();
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      // Fallback to user's assigned_roles or user_role
      loadRolesFromUser();
    } finally {
      setLoading(false);
    }
  }, []);

  // Load roles when component mounts or token changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadRoles();
    } else {
      setLoading(false);
    }
  }, [loadRoles]);

  // Also reload when token or user data changes (user logs in/out or data refreshes)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        if (e.newValue) {
          loadRoles();
        } else {
          // User logged out
          setAvailableRoles([]);
          setActiveRole(null);
          localStorage.removeItem("activeRoleId");
          localStorage.removeItem("activeRole");
        }
      }
      // Also reload roles when user data is refreshed (e.g., on checkAuth)
      if (e.key === "user" && e.newValue) {
        loadRolesFromUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadRoles]);

  // Switch active role
  const switchActiveRole = useCallback(async (roleId) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:1337/api"
        }/user-roles/me/active/${roleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to switch role");
      }

      const { data: role } = await response.json();
      setActiveRole(role);
      localStorage.setItem("activeRoleId", role.id || role.documentId);
      // Store active role for authProvider compatibility
      localStorage.setItem("activeRole", JSON.stringify(role));

      // Reload page to update UI
      window.location.reload();
    } catch (error) {
      console.error("Error switching role:", error);
      throw error;
    }
  }, []);

  // Permission checking functions
  const hasPermission = useCallback(
    (permission) => {
      if (!activeRole) return false;
      if (!activeRole.permissions || !Array.isArray(activeRole.permissions))
        return false;
      return activeRole.permissions.includes(permission);
    },
    [activeRole]
  );

  const hasAnyPermission = useCallback(
    (permissions) => {
      if (!activeRole) return false;
      if (!activeRole.permissions || !Array.isArray(activeRole.permissions))
        return false;
      return permissions.some((perm) => activeRole.permissions.includes(perm));
    },
    [activeRole]
  );

  const hasRole = useCallback(
    (role) => {
      if (!activeRole) return false;
      return activeRole.role === role;
    },
    [activeRole]
  );

  const value = {
    activeRole,
    availableRoles,
    loading,
    switchActiveRole,
    hasPermission,
    hasAnyPermission,
    hasRole,
    reloadRoles: loadRoles,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};
