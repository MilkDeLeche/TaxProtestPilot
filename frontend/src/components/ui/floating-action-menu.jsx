"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   options: { label: string; onClick: () => void; Icon?: React.ReactNode }[];
 *   trigger?: React.ReactNode;
 *   placement?: 'bottom-right' | 'top';
 *   className?: string;
 * }} props
 */
const FloatingActionMenu = ({ options, trigger, placement = "bottom-right", className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closeMenu();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isSidebar = placement === "top";
  const triggerButton = trigger ?? (
    <Button
      type="button"
      onClick={toggleMenu}
      className="w-10 h-10 rounded-full bg-[#11111198] hover:bg-[#111111d1] shadow-[0_0_20px_rgba(0,0,0,0.2)]"
    >
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut", type: "spring", stiffness: 300, damping: 20 }}
      >
        <PlusIcon className="w-6 h-6" />
      </motion.div>
    </Button>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        isSidebar ? "relative w-full" : "fixed bottom-8 right-8",
        className
      )}
    >
      {isSidebar ? (
        <div className="flex flex-col items-stretch gap-2">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-full left-0 right-0 z-[100] mb-2 flex flex-col items-stretch gap-0.5 rounded-lg border border-[#1e3a8a]/50 bg-[#0c1529] py-1 shadow-xl"
              >
                {options.map((option, index) => (
                  <motion.div
                    key={option.label}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        option.onClick();
                        closeMenu();
                      }}
                      data-testid={option.dataTestId}
                      className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-left text-slate-200 transition-all duration-200 hover:bg-[#1e40af]/20 hover:text-white [&_svg]:h-5 [&_svg]:w-5 [&_svg]:flex-shrink-0"
                    >
                      {option.Icon}
                      <span className="font-medium">{option.label}</span>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-haspopup="true"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] rounded-lg text-left w-full"
          >
            {trigger}
          </button>
        </div>
      ) : (
        <>
          <Button
            type="button"
            onClick={toggleMenu}
            className="w-10 h-10 rounded-full bg-[#11111198] hover:bg-[#111111d1] shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut", type: "spring", stiffness: 300, damping: 20 }}
            >
              <PlusIcon className="w-6 h-6" />
            </motion.div>
          </Button>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
                transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                className="absolute bottom-10 right-0 mb-2"
              >
                <div className="flex flex-col items-end gap-2">
                  {options.map((option, index) => (
                    <motion.div
                      key={option.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Button
                        type="button"
                        onClick={() => {
                          option.onClick();
                          closeMenu();
                        }}
                        size="sm"
                        className="flex items-center gap-2 bg-[#11111198] hover:bg-[#111111d1] shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none rounded-xl backdrop-blur-sm"
                        data-testid={option.dataTestId}
                      >
                        {option.Icon}
                        <span>{option.label}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default FloatingActionMenu;
