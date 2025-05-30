import React from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import NewRepository from './pages/NewRepository';
import Repositories from './pages/Repositories';
import StarredProjects from './pages/StarredProjects';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import { Toaster } from './components/ui/Toaster';
import { PrivateRoute } from './components/auth/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/repositories" element={<Repositories />} />
                <Route path="/starred-projects" element={<StarredProjects />} />
                <Route path="/new-repository" element={<NewRepository />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
