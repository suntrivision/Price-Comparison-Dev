
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access to favorites page even when not authenticated
  // For settings and accounts, require authentication
  if (!user && location.pathname !== '/favorites') {
    // Redirect to the login page but save the current location they were
    // trying to go to when they were redirected.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
