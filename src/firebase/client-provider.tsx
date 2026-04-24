'use client';

import React, { type ReactNode, useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider: Ensures Firebase services are only initialized on the client.
 * This prevents "Illegal invocation" and other SSR errors during the pre-render phase.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    // Safe to initialize now that we are definitely on the client
    const firebaseServices = initializeFirebase();
    setServices(firebaseServices);
  }, []);

  // Prevent rendering children that depend on Firebase until initialization is complete
  if (!services) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
           <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Initializing Identity Node...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
