import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon, BuildingOffice2Icon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState({
    displayName: '',
    phone: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const initialized = useRef(false);
  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;
    const meta = user.user_metadata || {};
    if (meta.practice_type && !meta.display_name) {
      setSelected(meta.practice_type);
      setStep(2);
      setProfile({
        displayName: meta.display_name || '',
        phone: meta.phone || '',
        email: meta.contact_email || user.email || '',
      });
    } else if (user.email) {
      setProfile((p) => ({ ...p, email: p.email || user.email }));
    }
  }, [user]);

  const handleContinueFromStep1 = () => {
    if (!selected) return;
    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    const name = profile.displayName?.trim();
    if (!name) {
      setError(selected === 'company' ? 'Please enter your company or LLC name.' : 'Please enter your name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding(selected, {
        displayName: name,
        phone: profile.phone,
        email: profile.email,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const isCompany = selected === 'company';
  const nameLabel = isCompany ? 'Company or LLC name' : 'Your name';
  const namePlaceholder = isCompany ? 'e.g. Acme Tax LLC' : 'e.g. Jane Smith';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1e40af]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl relative z-10"
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.3 }}
            >
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Tell us about your practice
          </h1>
          <p className="text-slate-500 mt-2">
            This helps us tailor your experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <motion.button
            type="button"
            onClick={() => setSelected('solo')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`relative rounded-2xl border-2 p-8 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-2 ${
              selected === 'solo'
                ? 'border-[#1e40af] bg-[#1e40af]/5 shadow-lg shadow-blue-900/10'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
              selected === 'solo' ? 'bg-[#1e40af] text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <UserIcon className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Solo practitioner
            </h2>
            <p className="text-slate-500 text-sm">
              I work on my own or with a small team. I manage my own clients and billing.
            </p>
            {selected === 'solo' && (
              <motion.div
                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#1e40af] flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setSelected('company')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`relative rounded-2xl border-2 p-8 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-2 ${
              selected === 'company'
                ? 'border-[#1e40af] bg-[#1e40af]/5 shadow-lg shadow-blue-900/10'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
              selected === 'company' ? 'bg-[#1e40af] text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <BuildingOffice2Icon className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Company or firm
            </h2>
            <p className="text-slate-500 text-sm">
              I’m part of a company or firm. We have multiple team members and shared clients.
            </p>
            {selected === 'company' && (
              <motion.div
                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#1e40af] flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        </div>

        {error && step === 1 && (
          <motion.p
            className="text-center text-red-600 text-sm mb-4"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}

        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <motion.button
            type="button"
            onClick={handleContinueFromStep1}
            disabled={!selected}
            whileHover={selected ? { scale: 1.05 } : {}}
            whileTap={selected ? { scale: 0.98 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="px-8 py-4 rounded-xl font-medium text-white bg-[#1e40af] hover:bg-[#1e3a8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg shadow-blue-900/20"
          >
            Continue
          </motion.button>
        </motion.div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8"
            >
              <button
                type="button"
                onClick={() => { setStep(1); setError(null); }}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-xl font-semibold text-slate-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Complete your profile
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                A few details so we can personalize your account.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">
                    {nameLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                    placeholder={namePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. (555) 123-4567"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/20 outline-none transition-all"
                  />
                </div>
              </div>

              {error && step === 2 && (
                <p className="mt-4 text-center text-red-600 text-sm">{error}</p>
              )}

              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.02 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="mt-6 w-full py-3.5 rounded-xl font-medium text-white bg-[#1e40af] hover:bg-[#1e3a8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg shadow-blue-900/20"
              >
                {submitting ? 'Setting up…' : 'Finish'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
