import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Footer } from '../components/landing/Footer';
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

const SUPPORT_EMAIL = 'support@taxprotestpilot.com';

const faqs = [
  {
    q: 'How do I reset my password?',
    a: 'Use the "Forgot password" link on the login page to enter your email. We\'ll send a reset link. Click it, set a new password, and you\'re done. Check spam if you don\'t see it, or contact us at support@taxprotestpilot.com.',
  },
  {
    q: 'Can I export data to QuickBooks?',
    a: 'Yes. After saving a batch in Saved Uploads, open it and use "Export to QuickBooks" or "Export & update invoice number" to download a CSV ready for QuickBooks import. See our Documentation for the full workflow.',
  },
  {
    q: 'What file formats are supported for upload?',
    a: 'We support CSV files. If you have Excel, export or save as CSV. The app will try to match column headers automatically; you can adjust mapping in the upload screen.',
  },
  {
    q: 'How is my data protected?',
    a: 'We use encryption in transit and at rest, secure infrastructure, and strict access controls. We do not sell your data. See our Privacy Policy for details.',
  },
  {
    q: 'Who do I contact for billing or account issues?',
    a: 'Send an email to support@taxprotestpilot.com with "Billing" or "Account" in the subject. We typically respond within one business day.',
  },
];

/** SEO: FAQPage schema for "Position 0" featured snippet in search results. */
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
};

export default function Support() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = message + (email ? `\n\n---\nReply-to: ${email}` : '');
    // Keep body under ~1500 chars to avoid mailto URL length limits in some browsers
    const safeBody = body.length > 1500 ? body.slice(0, 1500) + '\n\n[Message truncated. Please add the rest in your email client.]' : body;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject || 'Support request')}&body=${encodeURIComponent(safeBody)}`;
    // Use anchor click - more reliable than location.href in SPAs and some browsers
    const a = document.createElement('a');
    a.href = mailto;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
              Support
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-3xl">
              Get help, report an issue, or ask a question. We typically respond within one business day.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-12 lg:grid-cols-1">
            {/* Contact card + form */}
            <motion.section
              className="rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 sm:text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <EnvelopeIcon className="w-6 h-6 text-blue-300" />
                Contact us
              </h2>
              <p className="mt-2 text-gray-400 text-sm sm:text-base">
                Fill out the form below and we'll open your email client so you can send your message. You can also email us directly at{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-blue-300 hover:text-white font-medium transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="support-email" className="block text-sm font-medium text-gray-300">
                    Your email (optional)
                  </label>
                  <input
                    id="support-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="support-subject" className="block text-sm font-medium text-gray-300">
                    Subject
                  </label>
                  <input
                    id="support-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Billing question, Bug report, Feature request"
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="support-message" className="block text-sm font-medium text-gray-300">
                    Message
                  </label>
                  <textarea
                    id="support-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question in detail..."
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 sm:text-sm resize-y"
                    required
                  />
                </div>
                {submitted && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-blue-300"
                  >
                    Your email client should open. If it didn't, send a message directly to {SUPPORT_EMAIL}.
                  </motion.p>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1e40af] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0f172a] transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Open email to send
                </button>
              </form>
            </motion.section>

            {/* FAQ */}
            <motion.section
              className="rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 sm:text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <QuestionMarkCircleIcon className="w-6 h-6 text-blue-300" />
                Frequently asked questions
              </h2>
              <p className="mt-2 text-gray-400 text-sm sm:text-base">
                Quick answers to common questions. Can't find what you need? Use the contact form above.
              </p>
              <Accordion type="single" collapsible className="mt-6 w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
                    <AccordionTrigger className="text-left text-gray-200 hover:text-white py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400 text-sm pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.section>

            {/* Direct email CTA */}
            <motion.div
              className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-6 sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-300 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Prefer to email directly?
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Send a message to{' '}
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-300 hover:text-white font-medium">
                        {SUPPORT_EMAIL}
                      </a>
                      {' '}and we'll get back to you as soon as we can.
                    </p>
                  </div>
                </div>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors shrink-0"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Email support
                </a>
              </div>
            </motion.div>
          </div>

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
