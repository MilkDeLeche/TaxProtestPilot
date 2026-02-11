import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpTrayIcon, ChartBarIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

function useParallax(value, distance) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

const steps = [
  {
    number: '01',
    icon: ArrowUpTrayIcon,
    title: 'Import properties',
    description: 'Drop a CSV or add properties manually. Our parser maps columns automatically—no reformatting required.',
  },
  {
    number: '02',
    icon: ChartBarIcon,
    title: 'Run savings & fees',
    description: 'Set your fee structure and local rates. Get instant potential tax savings and client-ready numbers.',
  },
  {
    number: '03',
    icon: DocumentCheckIcon,
    title: 'Export & appeal',
    description: 'Generate appeal packages and client reports. Export in QuickBooks-friendly formats when you need them.',
  },
];

export const HowItWorksSection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const y = useParallax(scrollYProgress, 50);

  return (
    <section ref={sectionRef} id="how-it-works" className="py-24 md:py-32 bg-white dark:bg-gray-900">
      <motion.div style={{ y }} className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-[#1e40af] dark:text-blue-400 tracking-wide uppercase mb-4">
            How it works
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-6"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Simple as <span className="text-[#1e40af] dark:text-blue-400">1-2-3</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-gray-300 max-w-2xl mx-auto">
            From CSV to appeal-ready in minutes. No IT, no spreadsheets.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-gray-600 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="relative text-center"
              >
                {/* Step Number Circle */}
                <div className="relative inline-flex items-center justify-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-[#1e40af] dark:bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/20 dark:shadow-blue-900/40 relative z-10">
                    <step.icon className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-sm font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                </div>

                <h3
                  className="text-xl font-semibold text-slate-900 dark:text-white mb-4"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {step.title}
                </h3>
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
