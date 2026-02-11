import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export const GlassCard = ({ 
  children, 
  className, 
  animate = true,
  ...props 
}) => {
  const baseClasses = "rounded-xl bg-white/80 backdrop-blur-md border border-white/20 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]";

  if (!animate) {
    return (
      <div className={cn(baseClasses, className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(baseClasses, className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
