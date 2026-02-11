import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Wraps the app with Lenis for buttery smooth scrolling.
 * - lerp: lower = more momentum ("lurp"), 0.08 gives a slight ease-out glide
 * - smoothWheel: smooths mouse wheel and trackpad
 * - autoRaf: single rAF loop, no manual frame management (performance-safe)
 * - anchors: hash links (#section) scroll smoothly
 * - Disabled when prefers-reduced-motion to avoid performance/accessibility issues
 */
export function SmoothScroll({ children }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      window.scrollTo(0, 0);
      return;
    }

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      syncTouch: false,
      autoRaf: true,
      anchors: true,
      // Let nested scrollable elements (e.g. customer list) use native scroll
      prevent: (node) => !!node.closest('[data-lenis-prevent]'),
    });

    lenis.scrollTo(0, { immediate: true });

    return () => {
      lenis.destroy();
    };
  }, []);

  return children;
}
