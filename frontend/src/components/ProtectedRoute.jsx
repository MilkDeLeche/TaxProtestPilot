import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isOnboarding = location.pathname === '/onboarding';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50" style={{ fontFamily: 'Arimo, sans-serif' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1e40af] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const practiceType = user.user_metadata?.practice_type;
  const displayName = user.user_metadata?.display_name;
  const profileComplete = practiceType && displayName;
  if (!profileComplete && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isOnboarding) {
    return <Outlet />;
  }

  const isCustomers = location.pathname === '/customers';

  return (
    <div className={`min-h-screen bg-slate-50 ${isCustomers ? 'h-screen overflow-hidden' : ''}`}>
      <Sidebar />
      <main className={`ml-64 min-h-screen ${isCustomers ? 'h-[calc(100vh)] overflow-hidden' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};
