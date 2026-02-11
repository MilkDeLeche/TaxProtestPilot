import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Footer } from '../components/landing/Footer';
import {
  DocumentTextIcon,
  ScaleIcon,
  ShieldCheckIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const sections = [
  {
    id: 'acceptance',
    icon: DocumentTextIcon,
    title: 'Acceptance of Terms',
    content: [
      'By accessing or using Tax Protest Pilot ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We may update these terms from time to time; continued use after changes constitutes acceptance. It is your responsibility to review this page periodically.',
    ],
  },
  {
    id: 'description',
    icon: ScaleIcon,
    title: 'Description of Service',
    content: [
      'Tax Protest Pilot provides software tools for property tax protest workflows, including data import, savings calculations, client management, and export features. The Service is offered "as is" and we reserve the right to modify, suspend, or discontinue any part of it at any time with or without notice.',
    ],
  },
  {
    id: 'use',
    icon: ShieldCheckIcon,
    title: 'Acceptable Use',
    content: [
      'You agree to use the Service only for lawful purposes and in compliance with applicable laws. You may not: (a) use the Service to process data you do not have the right to use; (b) attempt to gain unauthorized access to any system or data; (c) interfere with or disrupt the Service or other users; (d) use automated means to scrape or extract data beyond normal use; or (e) resell or sublicense the Service without authorization. We may suspend or terminate access for violation of these terms.',
    ],
  },
  {
    id: 'liability',
    icon: XCircleIcon,
    title: 'Limitation of Liability',
    content: [
      'To the maximum extent permitted by law:',
      '(1) The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      '(2) Tax Protest Pilot and its affiliates, officers, and employees shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunity, arising from your use or inability to use the Service.',
      '(3) Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim, or one hundred dollars ($100), whichever is greater.',
      'You use the Service at your own risk. Tax and legal outcomes depend on your specific facts; we do not provide tax or legal advice.',
    ],
  },
  {
    id: 'indemnity',
    icon: ShieldCheckIcon,
    title: 'Indemnification',
    content: [
      'You agree to indemnify, defend, and hold harmless Tax Protest Pilot, its affiliates, and their respective officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, and expenses (including reasonable attorneys\' fees) arising from your use of the Service, your violation of these terms, or your violation of any third-party rights.',
    ],
  },
  {
    id: 'termination',
    icon: XCircleIcon,
    title: 'Termination',
    content: [
      'We may terminate or suspend your access to the Service at any time, with or without cause or notice. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive (including limitation of liability, indemnification, and governing law) will survive termination.',
    ],
  },
  {
    id: 'governing-law',
    icon: ScaleIcon,
    title: 'Governing Law',
    content: [
      'These Terms are governed by the laws of the State of Texas, United States, without regard to conflict of law principles. Any dispute shall be resolved in the state or federal courts located in Texas, and you consent to personal jurisdiction there.',
    ],
  },
  {
    id: 'contact',
    icon: DocumentTextIcon,
    title: 'Contact',
    content: [
      'For questions about these Terms of Service, please contact us via the Support page or at the contact information provided there.',
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <main className="relative isolate overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] pt-28 pb-24 sm:pb-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-3xl">
              Last updated: February 2025. Please read these terms carefully before using Tax Protest Pilot.
            </p>
          </motion.div>

          <motion.div
            className="mt-14 space-y-12"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {sections.map((section, i) => (
              <motion.section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8"
                variants={item}
              >
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 sm:text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  <section.icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-300 shrink-0" />
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3 text-gray-300 text-sm sm:text-base leading-relaxed">
                  {section.content.map((paragraph, j) => (
                    <p key={j}>{paragraph}</p>
                  ))}
                </div>
              </motion.section>
            ))}
          </motion.div>

          <motion.div
            className="mt-12"
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
