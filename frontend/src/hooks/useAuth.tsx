import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('mepaflow_token');
    const userStr = localStorage.getItem('mepaflow_user');
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  });

  const login = (token: string, user: User) => {
    localStorage.setItem('mepaflow_token', token);
    localStorage.setItem('mepaflow_user', JSON.stringify(user));
    setState({ token, user });
  };

  const logout = () => {
    localStorage.removeItem('mepaflow_token');
    localStorage.removeItem('mepaflow_user');
    setState({ token: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
