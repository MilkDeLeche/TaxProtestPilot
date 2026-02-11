import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { MotionButton } from '../components/MotionButton';
import { GlowEffect } from '../components/ui/glow-effect';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignUpMode = searchParams.get('mode') === 'signup';
  const { user, signInWithGoogle, signUpWithEmail, signInWithEmail, signInAsDemo, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bgLoaded, setBgLoaded] = useState(false);

  const BG_IMAGE = '/images/abstract-pastel-holographic-blurred-grainy-gradien-2026-01-08-07-39-02-utc.jpg';

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = BG_IMAGE;
  }, []);

  useEffect(() => {
    if (!user || loading) return;
    const practiceType = user.user_metadata?.practice_type;
    if (practiceType) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemoLogin = () => {
    setError(null);
    signInAsDemo();
    navigate('/onboarding', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(isSignUpMode ? 'Please enter email and password.' : 'Please enter your email and password.');
      return;
    }
    if (isSignUpMode) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }
    try {
      setIsSigningIn(true);
      if (isSignUpMode) {
        await signUpWithEmail(trimmedEmail, password);
        setError(null);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('Check your email to confirm your account, then sign in below.');
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900" style={{ fontFamily: 'Arimo, sans-serif' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-hidden flex flex-col justify-center sm:px-4 lg:px-8 transition-colors duration-300"
      style={{
        backgroundImage: bgLoaded ? `url(${BG_IMAGE})` : 'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e293b 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/15 pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col justify-center items-center min-h-0 flex-1 py-4 sm:py-6 overflow-hidden">
        <div className="w-full sm:max-w-[420px] px-4 sm:px-0 flex flex-col items-center">
          <div
            className="relative overflow-hidden px-5 py-4 sm:px-8 sm:py-5 backdrop-blur-2xl rounded-2xl w-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Logo + heading inside card */}
            <div className="text-center pb-3">
              <Link to="/" className="inline-block">
                <img
                  src="/images/TAXPILOT2logoitself.png"
                  alt="Tax Protest Pilot"
                  className="mx-auto h-16 w-auto"
                />
              </Link>
              <h2 className="mt-2 text-center text-xl font-bold leading-tight tracking-tight text-white">
                {isSignUpMode ? 'Create your account' : 'Sign in to your account'}
              </h2>
            </div>

            {error && (
              <div className={`mb-3 p-2 rounded-md text-xs text-center ${error.includes('Check your email') ? 'bg-green-500/20 border border-green-400/40 text-green-100' : 'bg-red-500/20 border border-red-400/40 text-red-100'}`}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-white">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full rounded-md bg-white/10 px-2.5 py-1.5 text-sm text-white outline outline-1 -outline-offset-1 outline-white/20 placeholder:text-white/50 focus:outline-2 focus:-outline-offset-2 focus:outline-white/40"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-white">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUpMode ? 'At least 6 characters' : 'Your password'}
                    className="block w-full rounded-md bg-white/10 px-2.5 py-1.5 text-sm text-white outline outline-1 -outline-offset-1 outline-white/20 placeholder:text-white/50 focus:outline-2 focus:-outline-offset-2 focus:outline-white/40"
                  />
                </div>
              </div>

              {isSignUpMode && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-white">
                    Confirm password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="block w-full rounded-md bg-white/10 px-2.5 py-1.5 text-sm text-white outline outline-1 -outline-offset-1 outline-white/20 placeholder:text-white/50 focus:outline-2 focus:-outline-offset-2 focus:outline-white/40"
                    />
                  </div>
                </div>
              )}

              {!isSignUpMode && (
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <div className="flex h-4 shrink-0 items-center">
                      <div className="group grid size-3.5 grid-cols-1">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          className="col-start-1 row-start-1 appearance-none rounded border border-white/30 bg-white/10 checked:border-blue-400 checked:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
                        />
                        <svg viewBox="0 0 14 14" fill="none" className="pointer-events-none col-start-1 row-start-1 size-2.5 self-center justify-self-center stroke-white">
                          <path d="M3 8L6 11L11 3.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-has-[:checked]:opacity-100" />
                        </svg>
                      </div>
                    </div>
                    <label htmlFor="remember-me" className="block text-xs text-white">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-xs font-semibold text-white/90 hover:text-white">
                    Forgot password?
                  </Link>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="flex w-full justify-center rounded-md bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSigningIn ? 'Please wait...' : isSignUpMode ? 'Create account' : 'Sign in'}
                </button>
              </div>
            </form>

            <div>
              <div className="mt-3 flex items-center gap-x-3">
                <div className="w-full flex-1 border-t border-white/20" />
                <p className="text-xs font-medium text-nowrap text-white">
                  Or continue with
                </p>
                <div className="w-full flex-1 border-t border-white/20" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="group relative rounded-md overflow-visible">
                  <GlowEffect
                    colors={['#EA4335', '#FBBC05', '#34A853', '#4285F4']}
                    mode="rotate"
                    blur="medium"
                    duration={4}
                    scale={1.15}
                    className="rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-80"
                  />
                  <MotionButton
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="relative z-10 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                    data-testid="google-signin-btn"
                  >
                    {isSigningIn ? (
                      <span className="flex items-center gap-1.5">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                          <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                          <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                          <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                          <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                        </svg>
                        <span className="text-xs font-semibold">Google</span>
                      </>
                    )}
                  </MotionButton>
                </div>

<MotionButton
                type="button"
                onClick={handleDemoLogin}
                variant="outline"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                data-testid="demo-login-btn"
              >
                <span className="text-xs font-semibold">Try demo</span>
              </MotionButton>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-white/80 shrink-0">
            {isSignUpMode ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-white hover:text-blue-200">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Not a member?{' '}
                <Link to="/login?mode=signup" className="font-semibold text-white hover:text-blue-200">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
