
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

// Helper to normalize permissions similar to reference
const normalizePermissions = (user) => {
    if (!user) return [];
    // If user has specific permissions array
    if (Array.isArray(user.permissions) && user.permissions.length > 0) {
        return user.permissions
            .map(p => typeof p === 'string' ? p : p?.name || p?.id || "")
            .filter(Boolean);
    }
    // Fallback: return the role as a permission
    return user.user_role || 'STUDENT';
};

export const authProvider = {
    login: async ({ username, password }) => {
        const request = new Request(`${apiUrl}/auth/local`, {
            method: 'POST',
            body: JSON.stringify({ identifier: username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });
        
        try {
            const response = await fetch(request);
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            const auth = await response.json();
            
            // Normalize data before storing
            const user = auth.user;
            const token = auth.jwt;
            
            // Ensure permissions are set
            user.permissions = normalizePermissions(user);
            
            localStorage.setItem('auth', JSON.stringify(auth));
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            // Reference stores userId separately too
            localStorage.setItem('userId', user.id); 
            
            return Promise.resolve();
        } catch (error) {
            throw new Error('Network error');
        }
    },
    logout: () => {
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        return Promise.resolve();
    },
    checkAuth: () => {
        return localStorage.getItem('token') ? Promise.resolve() : Promise.reject();
    },
    checkError: (error) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem('auth');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
            return Promise.reject();
        }
        return Promise.resolve();
    },
    getPermissions: () => {
        const userStr = localStorage.getItem('user');
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
        return Promise.resolve(user.user_role || 'STUDENT');
    },
    getIdentity: () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return Promise.reject();
        const user = JSON.parse(userStr);
        return Promise.resolve({
            id: user.id,
            fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
            avatar: user.profile_picture?.url,
            documentId: user.documentId,
            user_role: user.user_role,
            user_roles: user.user_roles || user.user_permissions,
        });
    },
    // Custom method to switch role
    switchRole: async (newRole) => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) throw new Error("Not authenticated");
        
        const user = JSON.parse(userStr);
        const documentId = user.documentId;
        
        if (!documentId) throw new Error("User ID missing");

        // Use update-doc endpoint since switch-role is missing on server
        const response = await fetch(`${apiUrl}/users/update-doc/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                data: { user_role: newRole }
            })
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
        
        localStorage.setItem('user', JSON.stringify(newUser));
        
        return newUser;
    }
};
