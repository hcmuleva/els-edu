import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('els_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (e) {
        localStorage.removeItem('els_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      
      // Handle different response structures
      let userResponse = response.user || response;
      
      const userData = {
        id: userResponse._id || userResponse.id,
        _id: userResponse._id || userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role || 'student',
      };
      
      setUser(userData);
      localStorage.setItem('els_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw so component can handle it
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.register({
        name,
        email,
        password,
        role: 'student',
      });
      
      const userData = {
        id: response._id || response.id,
        _id: response._id || response.id,
        name: response.name,
        email: response.email,
        role: response.role || 'student',
      };
      
      setUser(userData);
      localStorage.setItem('els_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; // Re-throw so component can handle it
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('els_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

