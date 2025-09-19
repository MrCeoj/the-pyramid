"use client";

import { useRef, useLayoutEffect } from 'react';

/**
 * A custom React hook that programmatically scrolls an overflowing
 * element to its horizontal center when the component mounts.
 * @returns A React ref object to be attached to the scrollable HTML element.
 */
export const useCenteredScroll = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element) {
      const isOverflowing = element.scrollWidth > element.clientWidth;

      if (isOverflowing) {
        const scrollOffset = (element.scrollWidth - element.clientWidth) / 2;
        element.scrollLeft = scrollOffset;
      }
    }
  }, []);
  return ref;
};