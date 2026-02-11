import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Footer } from '../components/landing/Footer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PrivacyFeaturesSectionWithHoverEffects } from '../components/blocks/feature-section-with-hover-effects';

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <main className="relative isolate overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] pt-28 pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4"
          >
            <h1
              className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Last updated: February 2025. How we collect, use, and protect your data—and that we never sell it.
            </p>
          </motion.div>

          <PrivacyFeaturesSectionWithHoverEffects />

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to home
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
