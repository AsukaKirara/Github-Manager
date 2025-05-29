import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized || !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};