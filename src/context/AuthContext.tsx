import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/challonge';

type User = {
  id: number | string;
  name: string;
  email: string;
  role: 'super_admin' | 'organizer' | 'judge' | 'viewer' | 'player';
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const saveSession = (payload: { user: User; token: string }) => {
    localStorage.setItem('token', payload.token);
    localStorage.setItem('user', JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    saveSession(response.data);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    saveSession(response.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
