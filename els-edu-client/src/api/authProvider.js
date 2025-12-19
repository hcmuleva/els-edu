const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

// Helper to normalize permissions similar to reference
const normalizePermissions = (user) => {
  if (!user) return [];
  // If user has specific permissions array
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions
      .map((p) => (typeof p === "string" ? p : p?.name || p?.id || ""))
      .filter(Boolean);
  }
  // Fallback: return the role as a permission
  return user.user_role || "STUDENT";
};

export const authProvider = {
  login: async ({ username, password }) => {
    const request = new Request(`${apiUrl}/auth/local`, {
      method: "POST",
      body: JSON.stringify({ identifier: username, password }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    try {
      const response = await fetch(request);
      if (response.status < 200 || response.status >= 300) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || "Invalid username or password"
        );
      }
      const auth = await response.json();

      // Normalize data before storing
      const user = auth.user;
      const token = auth.jwt;

      // Fetch full user data with populate to get profile_picture and other relations
      try {
        const userResponse = await fetch(`${apiUrl}/users/me?populate=*`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (userResponse.ok) {
          const fullUser = await userResponse.json();
          console.log("Full user data from /users/me:", fullUser);
          console.log("profile_picture from API:", fullUser.profile_picture);
          // Merge full user data (with profile_picture) with auth user data
          Object.assign(user, fullUser);
          console.log("Merged user data:", user);
          console.log("profile_picture after merge:", user.profile_picture);
        }
      } catch (fetchError) {
        // If fetching full user fails, continue with basic user data
        console.warn("Failed to fetch full user data:", fetchError);
      }

      // Ensure permissions are set
      user.permissions = normalizePermissions(user);

      localStorage.setItem("auth", JSON.stringify(auth));
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // Reference stores userId separately too
      localStorage.setItem("userId", user.id);

      return Promise.resolve();
    } catch (error) {
      throw new Error(error.message || "Network error");
    }
  },
  logout: () => {
    // Clear all auth-related data
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    // Force redirect to login page with base path (hash routing for React Admin)
    window.location.href = "/els-kids/#/login";
    return Promise.resolve();
  },
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return Promise.reject({ redirectTo: "/login" });
    }

    // Validate token by fetching current user from Strapi with populate to get profile_picture
    try {
      const response = await fetch(`${apiUrl}/users/me?populate=*`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token is invalid, clear storage and reject
        localStorage.removeItem("auth");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        return Promise.reject({ redirectTo: "/login" });
      }

      if (!response.ok) {
        // Other error, clear and reject
        localStorage.removeItem("auth");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        return Promise.reject({ redirectTo: "/login" });
      }

      const user = await response.json();
      
      console.log("checkAuth - user from /users/me:", user);
      console.log("checkAuth - profile_picture:", user.profile_picture);

      // Update stored user data in case it changed (now includes profile_picture)
      user.permissions = normalizePermissions(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id);
      
      // Verify it was stored correctly
      const storedUser = JSON.parse(localStorage.getItem("user"));
      console.log("checkAuth - stored user profile_picture:", storedUser?.profile_picture);

      return Promise.resolve();
    } catch (error) {
      // Network error or other issue, clear and reject
      localStorage.removeItem("auth");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      return Promise.reject({ redirectTo: "/login" });
    }
  },
  checkError: (error) => {
    const status = error.status || error.response?.status;
    if (status === 401) {
      // Clear auth data on unauthorized/forbidden
      localStorage.removeItem("auth");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      return Promise.reject({ redirectTo: "/login" });
    }
    return Promise.resolve();
  },
  getPermissions: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return Promise.reject();
    const user = JSON.parse(userStr);
    // Use the normalization logic
    const perms = normalizePermissions(user);
    // React Admin mostly expects a single role string or array.
    // Returning the primary role for now to maintain menu compatibility,
    // or check how MyMenu uses it. MyMenu checks .includes().
    // If we return 'TEACHER', it works. If we return ['TEACHER'], it works?
    // usePermissions returns whatever this promise resolves.
    // MyMenu: const { permissions } = usePermissions(); -> checks ['TEACHER', ...].includes(permissions)
    // If permissions is an array, includes check might fail if strict string eq check logic is bad.
    // MyMenu Code: const isTeacherOrAdmin = ['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(permissions);
    // This expects 'permissions' to be a STRING.
    return Promise.resolve(user.user_role || "STUDENT");
  },
  getIdentity: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return Promise.reject();
    const user = JSON.parse(userStr);
    
    // Helper to get profile picture URL from Strapi v5 structure
    // Structure: { id, documentId, url: "https://...", formats: {...}, ... }
    const getAvatarUrl = () => {
      if (!user.profile_picture) {
        return null;
      }
      
      // If it's already a URL string
      if (typeof user.profile_picture === 'string') {
        return user.profile_picture.startsWith('http') 
          ? user.profile_picture 
          : `${import.meta.env.VITE_API_URL || 'http://localhost:1337'}${user.profile_picture}`;
      }
      
      // Strapi v5 structure: profile_picture object with direct url property
      // The url is already absolute (from S3), so return as-is
      if (user.profile_picture.url) {
        return user.profile_picture.url;
      }
      
      // Fallback: try nested structures (for other Strapi versions)
      if (user.profile_picture.data?.url) {
        return user.profile_picture.data.url.startsWith('http')
          ? user.profile_picture.data.url
          : `${import.meta.env.VITE_API_URL || 'http://localhost:1337'}${user.profile_picture.data.url}`;
      }
      
      if (user.profile_picture.attributes?.url) {
        return user.profile_picture.attributes.url.startsWith('http')
          ? user.profile_picture.attributes.url
          : `${import.meta.env.VITE_API_URL || 'http://localhost:1337'}${user.profile_picture.attributes.url}`;
      }
      
      return null;
    };
    
    const avatarUrl = getAvatarUrl();
    console.log("getIdentity - user.profile_picture:", user.profile_picture);
    console.log("getIdentity - avatarUrl:", avatarUrl);
    
    return Promise.resolve({
      id: user.id,
      fullName:
        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        user.username,
      avatar: avatarUrl,
      documentId: user.documentId,
      user_role: user.user_role,
      user_roles: user.user_roles || user.user_permissions,
      assigned_roles: user.assigned_roles, // Include assigned_roles from user object
      profile_picture: user.profile_picture, // Also include raw profile_picture for debugging
    });
  },
  // Custom method to switch role
  switchRole: async (newRole) => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) throw new Error("Not authenticated");

    const user = JSON.parse(userStr);
    const documentId = user.documentId;

    if (!documentId) throw new Error("User ID missing");

    // Use update-doc endpoint since switch-role is missing on server
    const response = await fetch(`${apiUrl}/users/update-doc/${documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: { user_role: newRole },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || "Failed to switch role");
    }

    const { data: updatedUser } = await response.json();

    // Update local storage
    const newUser = { ...user, user_role: updatedUser.user_role };
    // Re-normalize permissions if needed
    newUser.permissions = normalizePermissions(newUser);

    localStorage.setItem("user", JSON.stringify(newUser));

    return newUser;
  },
};
