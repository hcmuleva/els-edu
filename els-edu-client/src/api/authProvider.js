import { PERMISSIONS_BY_ROLE, getHighestRole } from "../utils/constants";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

// Helper to normalize permissions similar to reference implementation
const normalizePermissions = (user) => {
  if (!user) return [];
  // If user has specific permissions array
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions
      .map((p) => (typeof p === "string" ? p : p?.name || p?.id || ""))
      .filter(Boolean);
  }
  // Fallback: use PERMISSIONS_BY_ROLE constant based on user_role
  return (
    PERMISSIONS_BY_ROLE[user.user_role] || PERMISSIONS_BY_ROLE["STUDENT"] || []
  );
};

// Helper to fetch full user data with specific relations populated
// Uses /users/:id endpoint which returns the user's full data
const fetchFullUserData = async (token, userId) => {
  if (!token || !userId) return null;

  try {
    // Use /users/me endpoint with specific populate for org, role, and profile_picture
    // Using populate[relation][fields] to get only specific fields
    const populateParams = new URLSearchParams({
      "populate[org][fields][0]": "documentId",
      "populate[org][fields][1]": "org_name",
      "populate[role][fields][0]": "id",
      "populate[role][fields][1]": "name",
      "populate[role][fields][2]": "type",
      "populate[profile_picture][fields][0]": "url",
      "populate[profile_picture][fields][1]": "formats",
    });

    const response = await fetch(
      `${apiUrl}/users/${userId}?_t=${Date.now()}&${populateParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch user data:", response.status);
      return null;
    }

    const data = await response.json();
    console.log("fetchFullUserData - raw response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching full user data:", error);
    return null;
  }
};

// Export refreshUser function so it can be called from outside authProvider
export const refreshUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Not authenticated");
  }

  const userId = localStorage.getItem("userId");
  const user = await fetchFullUserData(token, userId);
  if (!user) {
    throw new Error("Failed to fetch user data");
  }

  // Normalize permissions
  user.permissions = normalizePermissions(user);

  // Update localStorage
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("userId", user.id);
  if (user.documentId) {
    localStorage.setItem("userDocumentId", user.documentId);
  }

  console.log("refreshUser - User data refreshed:", user);
  return user;
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

      // Fetch full user data for complete content population
      const fullUser = await fetchFullUserData(token, user.id);

      if (!fullUser) {
        throw new Error("Failed to load user profile. Please try again.");
      }

      if (fullUser) {
        console.log("Full user data fetched:", fullUser);
        console.log("profile_picture:", fullUser.profile_picture);
        console.log("role:", fullUser.role);
        console.log("assigned_roles:", fullUser.assigned_roles);
        // Merge full user data with auth user data
        Object.assign(user, fullUser);
      }

      // Ensure permissions are set
      user.permissions = normalizePermissions(user);

      localStorage.setItem("auth", JSON.stringify(auth));
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // Store documentId for refresh fetching
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userDocumentId", user.documentId);

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
    localStorage.removeItem("userDocumentId");
    localStorage.removeItem("activeRoleId");
    localStorage.removeItem("activeRole");
    // Force redirect to login page with base path (hash routing for React Admin)
    window.location.href = "/els-kids/#/login";
    return Promise.resolve();
  },
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    const userDocumentId = localStorage.getItem("userDocumentId");

    if (!token) {
      return Promise.reject({ redirectTo: "/login" });
    }

    // Refresh user data on every checkAuth (page refresh/navigation)
    try {
      const userId = localStorage.getItem("userId");
      // Fetch fresh user data with full populate
      const user = await fetchFullUserData(token, userId);

      if (!user) {
        // Token is invalid or user not found, clear storage and reject
        localStorage.removeItem("auth");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("userDocumentId");
        return Promise.reject({ redirectTo: "/login" });
      }

      console.log("checkAuth - Refreshed user data:", user);
      console.log("checkAuth - profile_picture:", user.profile_picture);
      console.log("checkAuth - role:", user.role);
      console.log("checkAuth - assigned_roles:", user.assigned_roles);

      // Update stored user data with fresh data
      user.permissions = normalizePermissions(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id);
      if (user.documentId) {
        localStorage.setItem("userDocumentId", user.documentId);
      }

      return Promise.resolve();
    } catch (error) {
      console.error("checkAuth error:", error);
      // Network error or other issue, clear and reject
      localStorage.removeItem("auth");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("userDocumentId");
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
      localStorage.removeItem("userDocumentId");
      localStorage.removeItem("activeRoleId");
      localStorage.removeItem("activeRole");
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
      if (typeof user.profile_picture === "string") {
        return user.profile_picture.startsWith("http")
          ? user.profile_picture
          : `${import.meta.env.VITE_API_URL || "http://localhost:1337"}${
              user.profile_picture
            }`;
      }

      // Strapi v5 structure: profile_picture object with direct url property
      // The url is already absolute (from S3), so return as-is
      if (user.profile_picture.url) {
        return user.profile_picture.url;
      }

      // Fallback: try nested structures (for other Strapi versions)
      if (user.profile_picture.data?.url) {
        return user.profile_picture.data.url.startsWith("http")
          ? user.profile_picture.data.url
          : `${import.meta.env.VITE_API_URL || "http://localhost:1337"}${
              user.profile_picture.data.url
            }`;
      }

      if (user.profile_picture.attributes?.url) {
        return user.profile_picture.attributes.url.startsWith("http")
          ? user.profile_picture.attributes.url
          : `${import.meta.env.VITE_API_URL || "http://localhost:1337"}${
              user.profile_picture.attributes.url
            }`;
      }

      return null;
    };

    const avatarUrl = getAvatarUrl();
    console.log("getIdentity - user.profile_picture:", user.profile_picture);
    console.log("getIdentity - avatarUrl:", avatarUrl);

    return Promise.resolve({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      mobile_number: user.mobile_number,
      dob: user.dob,
      gender: user.gender,
      age: user.age,
      fullName:
        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        user.username,
      avatar: avatarUrl,
      documentId: user.documentId,
      user_role: user.user_role,
      role: user.role, // users-permissions role relation
      assigned_roles: user.assigned_roles, // JSON array of roles (replaces user_roles)
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
