import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, useScroll } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { PlayIcon } from '@heroicons/react/24/outline';

function useParallax(value, distance) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };
const transition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1.4, delay = 0, decimals = 0 }) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) =>
    prefix + (decimals ? v.toFixed(decimals) : Math.round(v)) + suffix
  );
  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [motionValue, value, duration, delay]);
  return <motion.span>{display}</motion.span>;
}

const PARALLAX_DISTANCE = 50;

export const HeroSection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const y = useParallax(scrollYProgress, PARALLAX_DISTANCE);

  return (
    <div ref={sectionRef} className="relative isolate overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a]">
      <motion.div
        aria-hidden="true"
        className="absolute top-10 left-[calc(50%-4rem)] -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:top-[calc(50%-30rem)] lg:left-48 xl:left-[calc(50%-24rem)]"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <div
          style={{
            clipPath:
              'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
          }}
          className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-[#1e40af] to-[#1e3a8a] opacity-20"
        />
      </motion.div>
      <motion.div style={{ y }} className="mx-auto max-w-7xl px-6 pt-10 pb-24 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:pt-8">
          <motion.img
            alt="Tax Protest Pilot"
            src="/images/TAXPILOT2%20dark.png"
            className="h-[265px] w-[406px] object-contain opacity-90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ ...transition, duration: 0.6 }}
          />
          <motion.div
            className="mt-24 sm:mt-32 lg:mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2">
              <span className="rounded-full bg-[#1e40af]/20 px-3 py-1 text-sm/6 font-semibold text-blue-300 ring-1 ring-[#1e40af]/30 ring-inset">
                <span className="mr-2 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse align-middle" aria-hidden />
                Trusted by 500+ Tax Professionals
              </span>
            </div>
          </motion.div>
          <motion.h1
            className="mt-10 text-5xl font-semibold tracking-tight text-pretty text-white sm:text-7xl"
            style={{ fontFamily: 'Manrope, sans-serif' }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.2 }}
          >
            Tax Intelligence for the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              Modern Professional
            </span>
          </motion.h1>
          <motion.p
            className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.35 }}
          >
            Automate property tax assessments, client management, and savings calculations in one crystal-clear dashboard.
          </motion.p>
          <motion.div
            className="mt-10 flex items-center gap-x-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/login"
                className="inline-block rounded-md bg-[#1e40af] px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-[#1e3a8a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e40af] transition-colors duration-200"
              >
                Get Started Free
              </Link>
            </motion.div>
            <motion.a
              href="#demo"
              className="inline-flex items-center text-sm/6 font-semibold text-white hover:text-blue-200 transition-colors duration-200"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlayIcon className="mr-2 w-5 h-5 text-white/80" aria-hidden />
              Watch Demo <span aria-hidden="true" className="ml-1">→</span>
            </motion.a>
          </motion.div>
          <motion.div
            className="mt-12 flex flex-wrap gap-10 border-t border-white/10 pt-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.65 }}
          >
            {[
              { value: 2.4, prefix: '$', suffix: 'M+', label: 'Saved for Clients', decimals: 1 },
              { value: 15, prefix: '', suffix: 'K+', label: 'Properties Analyzed', decimals: 0 },
              { value: 98, prefix: '', suffix: '%', label: 'Success Rate', decimals: 0 },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-3xl font-bold text-white">
                  <AnimatedNumber
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    delay={0.8 + i * 0.12}
                    decimals={stat.decimals ?? 0}
                  />
                </p>
                <p className="text-sm font-medium text-gray-400 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <motion.div
          className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:mt-24 lg:mr-0 lg:ml-10 lg:max-w-none lg:flex-none xl:ml-32"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...transition, delay: 0.4 }}
        >
          <motion.div
            className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none pt-6 lg:pt-12"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <img
              alt="App screenshot"
              src="/images/demohero.png"
              width={2432}
              height={1442}
              className="w-[76rem] rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
