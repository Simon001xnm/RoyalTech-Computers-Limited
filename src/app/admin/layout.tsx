
'use client';

import { useUser } from '@/firebase/provider';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { ShieldAlert, AlertTriangle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  
  // Get user role from local database for strict role-based access control
  const userProfile = useLiveQuery(async () => user ? await db.users.get(user.uid) : null, [user]);

  const isPanelEnabled = isFeatureEnabled('SUPER_ADMIN_PANEL');
  
  // STRICT SECURITY: Only a Super Admin (Platform Owner) can access this area.
  // Standard 'admin' roles (Tenant/Shop Owners) are strictly locked out.
  const isSuperAdmin = userProfile?.role === 'super_admin';

  if (!isPanelEnabled) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center p-8 text-center">
        <div className="bg-muted p-6 rounded-full mb-6">
            <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-20" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Layer 2 Hidden</h2>
        <p className="text-muted-foreground max-w-md"> The Platform Command module is currently disabled via global feature flags.</p>
        <Button asChild className="mt-8" variant="outline">
            <Link href="/">Return to Workspace</Link>
        </Button>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
        <div className="p-8 h-[80vh] flex flex-col items-center justify-center text-center">
             <div className="bg-destructive/10 p-6 rounded-full mb-6">
                <Lock className="h-12 w-12 text-destructive" />
             </div>
             <div className="max-w-md space-y-4">
                <h1 className="text-3xl font-black uppercase tracking-tighter">Access Restricted</h1>
                <p className="text-muted-foreground">
                    You are attempting to access the **SaaS Platform Command Center**. This area is reserved for the Global Platform Technician only.
                </p>
                <p className="text-xs font-bold text-destructive uppercase bg-destructive/10 p-2 rounded">
                    Unauthorized access attempts are logged.
                </p>
                <Button asChild className="mt-4 w-full h-12 font-bold" variant="outline">
                    <Link href="/">Back to Shop Dashboard</Link>
                </Button>
             </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-primary border-b border-primary/20 p-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground shadow-lg">
        Platform Nerve Center &bull; High Privilege Access
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {children}
      </div>
    </div>
  );
}
