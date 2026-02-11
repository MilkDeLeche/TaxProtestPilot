import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Footer } from '../components/landing/Footer';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <main className="relative isolate overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] pt-28 pb-24 sm:pb-32">
        <div className="mx-auto max-w-md px-6 lg:px-8">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <EnvelopeIcon className="w-6 h-6 text-blue-300" />
              <h1 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Forgot password
              </h1>
            </div>
            {sent ? (
              <div className="space-y-4">
                <p className="text-gray-300">
                  Check your email for a link to reset your password. If you don&apos;t see it, check your spam folder.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-white transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-300">
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 sm:text-sm"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 rounded-lg bg-[#1e40af] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0f172a] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            )}
            <div className="mt-6 pt-6 border-t border-white/10">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
