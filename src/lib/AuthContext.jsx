import React, { createContext, useContext } from 'react';
import { LOCAL_USER } from '@/api/base44Client';

// Standalone mode: no login server, every visitor works as a local user.
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const value = {
    user: LOCAL_USER,
    currentUser: LOCAL_USER,
    isAuthenticated: true,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    logout: () => {},
    navigateToLogin: () => {},
    checkAppState: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
