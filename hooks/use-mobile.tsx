import { useState, useEffect } from 'react';

export function useIsMobile(MOBILE_BREAKPOINT = 768) {
  // Start with false as default (assumes desktop-first)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set initial value
    checkIsMobile();

    // Create media query listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    } 
    // Fallback for older browsers
    else {
      mql.addListener(handleChange);
      return () => mql.removeListener(handleChange);
    }
  }, [MOBILE_BREAKPOINT]);

  return isMobile;
}