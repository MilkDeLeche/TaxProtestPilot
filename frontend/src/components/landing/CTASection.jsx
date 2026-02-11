import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { MotionButton } from '../MotionButton';

export const CTASection = () => {
  return (
    <section className="py-24 md:py-32 bg-slate-900 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1e40af]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Ready to Modernize Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Tax Practice?
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Join thousands of property tax professionals who are saving time and increasing revenue with Tax Protest Pilot.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link to="/login">
                <MotionButton
                  size="xl"
                  className="bg-white text-slate-900 hover:bg-slate-100 shadow-2xl transition-colors duration-200"
                  data-testid="cta-get-started-btn"
                >
                  Get Started Free
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </MotionButton>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <MotionButton
                size="xl"
                variant="ghost"
                className="text-white border-2 border-white/20 hover:bg-white/10 transition-colors duration-200"
              >
                Schedule Demo
              </MotionButton>
            </motion.div>
          </motion.div>

          <p className="mt-8 text-sm text-slate-500">
            No credit card required. Try it free on all plans.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
