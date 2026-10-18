
'use client';

import React from 'react';

/**
 * @fileOverview Super Admin Layout
 * Forces a dark theme specifically for the platform management node
 * to distinguish it from the standard business workspaces.
 */
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark bg-background min-h-screen text-foreground selection:bg-primary selection:text-white">
        {children}
    </div>
  );
}
