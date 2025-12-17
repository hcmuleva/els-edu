import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RoleContext = createContext(null);

export const useRoleContext = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRoleContext must be used within RoleProvider');
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

  // Load user roles from API
  const loadRoles = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all user roles from UserRole collection (not Strapi's built-in roles)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:1337/api'}/user-roles/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If 401/403, user might not be authenticated yet
        if (response.status === 401 || response.status === 403) {
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch roles');
      }

      const { data: roles } = await response.json();
      setAvailableRoles(roles || []);

      // Get active role ID from localStorage or use first active role
      const storedActiveRoleId = localStorage.getItem('activeRoleId');
      let roleToSet = null;

      if (storedActiveRoleId && roles) {
        roleToSet = roles.find(r => r.id === parseInt(storedActiveRoleId) || r.documentId === storedActiveRoleId);
      }

      // If no stored role or stored role not found, use first active role or first role
      if (!roleToSet && roles && roles.length > 0) {
        roleToSet = roles.find(r => r.isActive) || roles[0];
      }

      if (roleToSet) {
        setActiveRole(roleToSet);
        localStorage.setItem('activeRoleId', roleToSet.id || roleToSet.documentId);
        // Store active role for authProvider compatibility
        localStorage.setItem('activeRole', JSON.stringify(roleToSet));
      } else {
        // Fallback: try to get user_role from localStorage user object
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.user_role) {
              setActiveRole({
                role: user.user_role,
                permissions: [],
                isActive: true,
              });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      // Fallback: try to get user_role from localStorage user object
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.user_role) {
            setActiveRole({
              role: user.user_role,
              permissions: [],
              isActive: true,
            });
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load roles when component mounts or token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadRoles();
    } else {
      setLoading(false);
    }
  }, [loadRoles]);

  // Also reload when token changes (user logs in/out)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          loadRoles();
        } else {
          // User logged out
          setAvailableRoles([]);
          setActiveRole(null);
          localStorage.removeItem('activeRoleId');
          localStorage.removeItem('activeRole');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadRoles]);

  // Switch active role
  const switchActiveRole = useCallback(async (roleId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:1337/api'}/user-roles/me/active/${roleId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to switch role');
      }

      const { data: role } = await response.json();
      setActiveRole(role);
      localStorage.setItem('activeRoleId', role.id || role.documentId);
      // Store active role for authProvider compatibility
      localStorage.setItem('activeRole', JSON.stringify(role));
      
      // Reload page to update UI
      window.location.reload();
    } catch (error) {
      console.error('Error switching role:', error);
      throw error;
    }
  }, []);

  // Permission checking functions
  const hasPermission = useCallback((permission) => {
    if (!activeRole) return false;
    if (!activeRole.permissions || !Array.isArray(activeRole.permissions)) return false;
    return activeRole.permissions.includes(permission);
  }, [activeRole]);

  const hasAnyPermission = useCallback((permissions) => {
    if (!activeRole) return false;
    if (!activeRole.permissions || !Array.isArray(activeRole.permissions)) return false;
    return permissions.some(perm => activeRole.permissions.includes(perm));
  }, [activeRole]);

  const hasRole = useCallback((role) => {
    if (!activeRole) return false;
    return activeRole.role === role;
  }, [activeRole]);

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

