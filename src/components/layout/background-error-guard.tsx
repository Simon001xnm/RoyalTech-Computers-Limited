
'use client';

import React, { useEffect } from 'react';

/**
 * A root-level component that catches and suppresses generic background fetch errors.
 * This prevents transient Dexie Cloud or Firestore "Failed to fetch" errors from
 * triggering the Next.js global error overlay.
 */
export function BackgroundErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Check if it's a "Failed to fetch" error which is common during sync
      if (event.reason instanceof Error && event.reason.message === 'Failed to fetch') {
        // Silently prevent the error from bubbling up to the browser/overlay
        event.preventDefault();
        console.debug('Background fetch suppressed:', event.reason.message);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  return <>{children}</>;
}
