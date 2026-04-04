'use client';

import { useEffect } from 'react';

/**
 * A client component that registers the service worker for PWA support.
 * Enhanced with better error handling to avoid "Failed to fetch" console noise.
 */
export function PwaRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Only register if not already registered
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length === 0) {
          window.addEventListener('load', () => {
            navigator.serviceWorker
              .register('/sw.js')
              .catch((error) => {
                // Silently handle PWA fetch errors
                console.debug('PWA Service Worker registration skipped or failed:', error);
              });
          });
        }
      });
    }
  }, []);

  return null;
}
