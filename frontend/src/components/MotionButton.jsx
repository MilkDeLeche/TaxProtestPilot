import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export const MotionButton = ({ 
  children, 
  className, 
  variant = 'default',
  size = 'default',
  disabled,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-[#1e40af] text-white hover:bg-[#1e3a8a] shadow-lg shadow-blue-900/20",
    outline: "border-2 border-[#1e40af] text-[#1e40af] hover:bg-[#1e40af]/10",
    ghost: "text-[#1e40af] hover:bg-[#1e40af]/10",
    gradient: "bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white shadow-lg shadow-blue-900/30 hover:shadow-xl",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-900/20",
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 text-sm",
    lg: "h-12 px-8 text-base",
    xl: "h-14 px-10 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};
