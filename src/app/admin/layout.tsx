'use client';

/**
 * @fileOverview Admin Layout
 * Removed redundant AuthGuard which caused double-sidebar layout issues.
 * The global AuthGuard in root Providers already handles security.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
