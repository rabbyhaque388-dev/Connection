import { useState, useEffect } from 'react';

/**
 * useDebounce — Debounces a value by a given delay.
 *
 * Useful for search inputs, live filtering, or preventing rapid API calls.
 *
 * @param {*}      value - The value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 400ms)
 *
 * @returns {*} debouncedValue - The value after the delay has elapsed without change
 */
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup cancels the timer if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
