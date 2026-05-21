import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/ui/Loader';
import Shell from '../components/layout/Shell';

// Pages lazy-like dynamic imports
import AuthPage from '../pages/AuthPage';
import SwipePage from '../pages/SwipePage';
import ChatPage from '../pages/ChatPage';
import ProfilePage from '../pages/ProfilePage';
import ConfirmEmailLogin from '../pages/ConfirmEmailLogin';

// 1. Private Route Guard to redirect anonymous users
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen={true} message="Tethering connection..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Shell>{children}</Shell>;
};

// 2. Public Route Guard to prevent signed-in users from seeing Auth onboarding
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen={true} message="Restoring session..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Protected App views */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <SwipePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />

      {/* Public Auth views */}
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* Firebase Email Link landing page */}
      <Route path="/confirm-email-login" element={<ConfirmEmailLogin />} />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
