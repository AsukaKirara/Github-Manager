import React, { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { AuthState, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SALT_ROUNDS = 10;
const AUTH_KEY = 'auth_hash';
const INIT_KEY = 'is_initialized';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isInitialized: !!localStorage.getItem(INIT_KEY),
  });

  const initialize = async (password: string) => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    localStorage.setItem(AUTH_KEY, hash);
    localStorage.setItem(INIT_KEY, 'true');
    setState(prev => ({ ...prev, isInitialized: true }));
  };

  const login = async (password: string): Promise<boolean> => {
    const hash = localStorage.getItem(AUTH_KEY);
    if (!hash) return false;

    const isValid = await bcrypt.compare(password, hash);
    if (isValid) {
      setState(prev => ({ ...prev, isAuthenticated: true }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, isAuthenticated: false }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, initialize }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};