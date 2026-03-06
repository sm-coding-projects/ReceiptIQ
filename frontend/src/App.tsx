import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import BatchDetailPage from '@/pages/BatchDetailPage';
import ApiKeysPage from '@/pages/ApiKeysPage';

export default function App() {
  const { user, loading, login, register, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={logout} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={<LoginPage onLogin={login} loading={loading} />}
        />
        <Route
          path="/register"
          element={<RegisterPage onRegister={register} loading={loading} />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <DashboardPage user={user!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/batch/:id"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <BatchDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/api-keys"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <ApiKeysPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-primary-200 mb-4">404</h1>
                <h2 className="text-xl font-semibold text-primary-900 mb-2">Page not found</h2>
                <p className="text-sm text-primary-500 mb-8">
                  The page you are looking for does not exist or has been moved.
                </p>
                <a href="/" className="btn-primary">
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
