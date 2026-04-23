
'use client';

import { useUser } from '@/firebase/provider';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  
  // Get user role from local database for more reliable super-admin resolution
  const userProfile = useLiveQuery(async () => user ? await db.users.get(user.uid) : null, [user]);

  const isPanelEnabled = isFeatureEnabled('SUPER_ADMIN_PANEL');
  
  // In prototype mode, we allow the primary Workspace Admin to access the panel if enabled
  const isSuperAdmin = 
    userProfile?.role === 'super_admin' || 
    (isPanelEnabled && userProfile?.role === 'admin') ||
    user?.email?.endsWith('@simonstyless.com');

  if (!isPanelEnabled) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center p-8 text-center">
        <div className="bg-muted p-6 rounded-full mb-6">
            <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-20" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Layer 2 Hidden</h2>
        <p className="text-muted-foreground max-w-md"> The Super Admin module is currently disabled via feature flags to protect the Golden v1.0 build.</p>
        <Button asChild className="mt-8" variant="outline">
            <Link href="/">Return to Workspace</Link>
        </Button>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
        <div className="p-8">
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Restricted</AlertTitle>
                <AlertDescription>
                    You are attempting to access the SaaS Platform Control. This area is reserved for Platform Technicians only.
                </AlertDescription>
            </Alert>
             <Button asChild className="mt-4">
                <Link href="/">Back to Dashboard</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-destructive/10 border-b border-destructive/20 p-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-destructive">
        Platform Command Console &bull; Use with Caution
      </div>
      {children}
    </div>
  );
}
