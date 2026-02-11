import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Footer } from '../components/landing/Footer';
import {
  ShieldCheckIcon,
  UserCircleIcon,
  DocumentMagnifyingGlassIcon,
  LockClosedIcon,
  NoSymbolIcon,
  EnvelopeIcon,
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
    id: 'overview',
    icon: ShieldCheckIcon,
    title: 'Overview',
    content: [
      'Tax Protest Pilot ("we", "our") respects your privacy. This policy describes what information we collect, how we use it, and your choices. We do not sell your personal information to third parties.',
    ],
  },
  {
    id: 'information-we-collect',
    icon: UserCircleIcon,
    title: 'Information We Collect',
    content: [
      'We collect information you provide directly: account details (email, name, password hash), data you upload (e.g. property and client information for tax workflows), settings and preferences, and support or contact messages.',
      'We automatically collect: usage data (pages visited, features used), device and browser information, and log data (IP address, timestamps). We may use cookies and similar technologies as described below.',
    ],
  },
  {
    id: 'how-we-use',
    icon: DocumentMagnifyingGlassIcon,
    title: 'How We Use Your Information',
    content: [
      'We use your information to: provide, maintain, and improve the Service; process your data and run calculations; authenticate you and manage your account; send service-related communications (e.g. password reset, billing); respond to support requests; analyze usage to improve the product; and comply with legal obligations.',
      'We do not use your data for advertising profiling or selling to data brokers.',
    ],
  },
  {
    id: 'no-selling',
    icon: NoSymbolIcon,
    title: 'We Do Not Sell Your Information',
    content: [
      'We do not sell, rent, or trade your personal information or the data you upload (including property or client data) to third parties for their marketing or other purposes. Your data is used only as described in this policy and to operate the Service.',
    ],
    highlight: true,
  },
  {
    id: 'sharing',
    icon: LockClosedIcon,
    title: 'Sharing and Disclosure',
    content: [
      'We may share information only in these limited cases: (1) with service providers who assist us (e.g. hosting, analytics), under strict confidentiality; (2) if required by law or to protect rights and safety; (3) in connection with a merger, sale, or acquisition, with notice; (4) with your consent. We do not share your data for third-party marketing.',
    ],
  },
  {
    id: 'retention',
    icon: DocumentMagnifyingGlassIcon,
    title: 'Data Retention',
    content: [
      'We retain your account and uploaded data for as long as your account is active or as needed to provide the Service. You may request deletion of your account and associated data; we will delete or anonymize it in accordance with our retention schedule and legal obligations.',
    ],
  },
  {
    id: 'security',
    icon: LockClosedIcon,
    title: 'Security',
    content: [
      'We use industry-standard measures to protect your data, including encryption in transit and at rest, access controls, and secure infrastructure. No method of transmission or storage is 100% secure; we encourage strong passwords and careful handling of your account.',
    ],
  },
  {
    id: 'cookies',
    icon: DocumentMagnifyingGlassIcon,
    title: 'Cookies and Similar Technologies',
    content: [
      'We use cookies and similar technologies for session management, preferences, and analytics to improve the Service. You can control cookies through your browser settings; disabling some may affect functionality.',
    ],
  },
  {
    id: 'rights',
    icon: UserCircleIcon,
    title: 'Your Rights',
    content: [
      'Depending on your location, you may have the right to: access, correct, or delete your personal data; port your data; object to or restrict certain processing; and withdraw consent. To exercise these rights, contact us via the Support page. You may also have the right to lodge a complaint with a supervisory authority.',
    ],
  },
  {
    id: 'contact',
    icon: EnvelopeIcon,
    title: 'Contact Us',
    content: [
      'For privacy-related questions or to exercise your rights, contact us via the Support page. We will respond in accordance with applicable law.',
    ],
  },
];

export default function Privacy() {
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
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-3xl">
              Last updated: February 2025. How we collect, use, and protect your data—and that we never sell it.
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
                className={`scroll-mt-24 rounded-2xl border p-6 sm:p-8 ${
                  section.highlight
                    ? 'bg-blue-500/10 border-blue-400/20'
                    : 'bg-white/5 border-white/10'
                }`}
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
