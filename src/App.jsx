import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { PrivateRoute } from './features/auth/PrivateRoute';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { ThemeProvider } from './shared/context/ThemeContext';
import './index.css';

// Lazy loading para Code Splitting
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage').then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })));
const ProjectPage = lazy(() => import('./features/projects/pages/ProjectPage').then(module => ({ default: module.ProjectPage })));

import { LoadingScreen } from './shared/components/LoadingScreen';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/projects/:projectId"
                  element={
                    <PrivateRoute>
                      <ProjectPage />
                    </PrivateRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
