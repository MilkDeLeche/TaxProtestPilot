import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash?.substring(1) || '');
        const type = hashParams.get('type');
        if (type === 'recovery') {
          if (mounted) navigate('/set-new-password', { replace: true });
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (mounted) {
          if (session) {
            const practiceType = session.user?.user_metadata?.practice_type;
            navigate(practiceType ? '/dashboard' : '/onboarding', { replace: true });
          } else {
            setError('Failed to establish session');
            setTimeout(() => navigate('/login', { replace: true }), 2000);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Auth callback error:', err);
          setError(err.message);
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900" style={{ fontFamily: 'Arimo, sans-serif' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h1>
          <p className="text-slate-400">{error}</p>
          <p className="text-slate-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900" style={{ fontFamily: 'Arimo, sans-serif' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#1e40af] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
