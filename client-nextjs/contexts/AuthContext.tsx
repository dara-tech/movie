import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin?: string;
  loginCount: number;
  preferences: {
    assistantName: string;
    theme: string;
    language: string;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user data
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/register', { username, email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updatePreferences = async (preferences: Partial<User['preferences']>) => {
    try {
      const response = await api.put('/api/auth/preferences', { preferences });
      setUser(prev => prev ? { ...prev, preferences: { ...prev.preferences, ...preferences } } : null);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update preferences');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updatePreferences,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
