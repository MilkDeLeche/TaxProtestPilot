import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const screenshotTransition = { duration: 1, ease: [0.22, 1, 0.36, 1] };

function useParallax(value, distance) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

export const FeaturesSection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const y = useParallax(scrollYProgress, -60);

  return (
    <section ref={sectionRef} id="features" className="bg-white py-24 sm:py-32 dark:bg-gray-900">
      <motion.div style={{ y }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl sm:text-center">
          <h2 className="text-base font-semibold leading-7 text-[#1e40af] dark:text-blue-400">
            Everything you need
          </h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl sm:text-balance dark:text-white">
            Win more appeals. Stress less.
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            One platform for property tax protests: import data, run savings calculations, manage clients, and generate appeal packages. Export in formats QuickBooks loves—no spreadsheets required.
          </p>
        </div>
      </div>
      <div className="relative overflow-hidden pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.img
            width={2432}
            height={1442}
            src="/images/msedge_kfxoT8Vvui.png"
            alt="App screenshot"
            className="mb-[-12%] rounded-xl shadow-2xl ring-1 ring-gray-900/10 dark:hidden dark:ring-white/10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={screenshotTransition}
          />
          <motion.img
            width={2432}
            height={1442}
            src="https://tailwindcss.com/plus-assets/img/component-images/dark-project-app-screenshot.png"
            alt="App screenshot"
            className="mb-[-12%] rounded-xl shadow-2xl ring-1 ring-gray-900/10 hidden dark:block dark:ring-white/10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={screenshotTransition}
          />
          <div aria-hidden="true" className="relative">
            <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-white pt-[7%] dark:from-gray-900" />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
        <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 dark:text-gray-400">
          <div className="relative pl-9">
            <dt className="inline font-semibold text-gray-900 dark:text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="absolute top-1 left-1 size-5 text-indigo-600 dark:text-indigo-400">
                <path fillRule="evenodd" clipRule="evenodd" d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765 4.5 4.5 0 0 1 8.302-3.046 3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z" />
              </svg>
              Live in minutes.
            </dt>
            <dd className="inline">Sign up, upload your first CSV, and start running savings analyses the same day. No IT, no setup headaches.</dd>
          </div>
          <div className="relative pl-9">
            <dt className="inline font-semibold text-gray-900 dark:text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="absolute top-1 left-1 size-5 text-indigo-600 dark:text-indigo-400">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" />
              </svg>
              Your data, locked down.
            </dt>
            <dd className="inline">Bank-level encryption and secure storage. We never sell or share client information—ever.</dd>
          </div>
          <div className="relative pl-9">
            <dt className="inline font-semibold text-gray-900 dark:text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="absolute top-1 left-1 size-5 text-indigo-600 dark:text-indigo-400">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" />
              </svg>
              Smart CSV import.
            </dt>
            <dd className="inline">Drag, drop, done. We auto-detect columns and clean property data so you can process hundreds of parcels in one go.</dd>
          </div>
          <div className="relative pl-9">
            <dt className="inline font-semibold text-gray-900 dark:text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="absolute top-1 left-1 size-5 text-indigo-600 dark:text-indigo-400">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 2.5c-1.31 0-2.526.386-3.546 1.051a.75.75 0 0 1-.82-1.256A8 8 0 0 1 18 9a22.47 22.47 0 0 1-1.228 7.351.75.75 0 1 1-1.417-.49A20.97 20.97 0 0 0 16.5 9 6.5 6.5 0 0 0 10 2.5ZM4.333 4.416a.75.75 0 0 1 .218 1.038A6.466 6.466 0 0 0 3.5 9a7.966 7.966 0 0 1-1.293 4.362.75.75 0 0 1-1.257-.819A6.466 6.466 0 0 0 2 9c0-1.61.476-3.11 1.295-4.365a.75.75 0 0 1 1.038-.219ZM10 6.12a3 3 0 0 0-3.001 3.041 11.455 11.455 0 0 1-2.697 7.24.75.75 0 0 1-1.148-.965A9.957 9.957 0 0 0 5.5 9c0-.028.002-.055.004-.082a4.5 4.5 0 0 1 8.996.084V9.15l-.005.297a.75.75 0 1 1-1.5-.034c.003-.11.004-.219.005-.328a3 3 0 0 0-3-2.965Zm0 2.13a.75.75 0 0 1 .75.75c0 3.51-1.187 6.745-3.181 9.323a.75.75 0 1 1-1.186-.918A13.687 13.687 0 0 0 9.25 9a.75.75 0 0 1 .75-.75Zm3.529 3.698a.75.75 0 0 1 .584.885 18.883 18.883 0 0 1-2.257 5.84.75.75 0 1 1-1.29-.764 17.386 17.386 0 0 0 2.078-5.377.75.75 0 0 1 .885-.584Z" />
              </svg>
              Audit-ready reports.
            </dt>
            <dd className="inline">Generate professional appeal packages and export audit trails with one click. Stay compliant and impress clients.</dd>
          </div>
          <div className="relative pl-9">
            <dt className="inline font-semibold text-gray-900 dark:text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="absolute top-1 left-1 size-5 text-indigo-600 dark:text-indigo-400">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
              Your rules, your fees.
            </dt>
            <dd className="inline">Set fee structures, templates, and workflows once. Export billing and client data in QuickBooks-friendly formats when you need it. Focus on winning appeals.</dd>
          </div>
          <div className="relative pl-9">
            <dt className="inline font-semibold text-gray-900 dark:text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="absolute top-1 left-1 size-5 text-indigo-600 dark:text-indigo-400">
                <path d="M4.632 3.533A2 2 0 0 1 6.577 2h6.846a2 2 0 0 1 1.945 1.533l1.976 8.234A3.489 3.489 0 0 0 16 11.5H4c-.476 0-.93.095-1.344.267l1.976-8.234Z" />
                <path fillRule="evenodd" clipRule="evenodd" d="M4 13a2 2 0 1 0 0 4h12a2 2 0 1 0 0-4H4Zm11.24 2a.75.75 0 0 1 .75-.75H16a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75h-.01a.75.75 0 0 1-.75-.75V15Zm-2.25-.75a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 0 0 .75-.75V15a.75.75 0 0 0-.75-.75h-.01Z" />
              </svg>
              Automatic backups.
            </dt>
            <dd className="inline">Every change is saved. Restore or export client data anytime—no more lost spreadsheets or missing files.</dd>
          </div>
        </dl>
      </div>
      </motion.div>
    </section>
  );
};
