import { Navigate, useLocation } from 'react-router-dom';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  user: User | null;
  loading: boolean;
  children: React.ReactNode;
}

export default function ProtectedRoute({ user, loading, children }: ProtectedRouteProps) {
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
          <p className="text-sm text-primary-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
