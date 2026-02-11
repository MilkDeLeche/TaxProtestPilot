import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to top when the route changes.
 * Works with both native scroll and Lenis smooth scroll.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Try Lenis first (set by SmoothScroll)
    const lenis = window.__lenis;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
