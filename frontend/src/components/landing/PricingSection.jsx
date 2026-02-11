import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { MotionButton } from '../MotionButton';

function useParallax(value, distance) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

const plans = [
  {
    name: 'Starter',
    price: '$249',
    period: '/year',
    description: 'Solo pros and small batches',
    features: [
      'Up to 500 properties per year',
      'Smart CSV import',
      'Savings calculator & reports',
      'Email support',
      'QuickBooks-friendly export',
    ],
    cta: 'Try it free',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$599',
    period: '/year',
    description: 'Growing practices, more volume',
    features: [
      'Up to 2,500 properties per year',
      'Everything in Starter',
      'Priority support',
      'Client management tools',
      'Appeal package generation',
      'Custom fee structures',
    ],
    cta: 'Try it free',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Firms & high-volume shops',
    features: [
      'Higher volume or unlimited',
      'Everything in Professional',
      'Dedicated support',
      'Custom workflows & integrations',
      'Training & onboarding',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const PricingSection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const y = useParallax(scrollYProgress, -50);

  return (
    <section ref={sectionRef} id="pricing" className="py-24 md:py-32 bg-slate-50">
      <motion.div style={{ y }} className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-[#1e40af] tracking-wide uppercase mb-4">
            Pricing
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Simple <span className="text-[#1e40af]">yearly</span> plans
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            One price per appeal season. Pay annually, use it when you need it. Try it free: upload a CSV, calculate, and view results with your settings.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: plan.popular ? -8 : -6, transition: { duration: 0.25 } }}
              className={`relative rounded-2xl p-8 transition-shadow duration-300 hover:shadow-xl ${
                plan.popular
                  ? 'bg-[#1e40af] text-white shadow-2xl shadow-blue-900/30 scale-105 z-10 hover:shadow-2xl hover:shadow-blue-900/40'
                  : 'bg-white text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-900 text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? 'text-blue-200' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className={plan.popular ? 'text-blue-200' : 'text-slate-500'}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.popular ? 'bg-white/20' : 'bg-green-100'
                    }`}>
                      <CheckIcon className={`w-3 h-3 ${plan.popular ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <span className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-slate-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/login">
                <MotionButton
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-white text-[#1e40af] hover:bg-blue-50' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  data-testid={`pricing-${plan.name.toLowerCase()}-btn`}
                >
                  {plan.cta}
                </MotionButton>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
