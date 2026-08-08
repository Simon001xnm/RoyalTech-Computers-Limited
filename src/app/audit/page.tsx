'use client';

import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuditRetiredPage() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-8 text-center bg-background">
      <div className="bg-muted p-6 rounded-full mb-6">
          <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-20" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Module Decommissioned</h2>
      <p className="text-muted-foreground max-w-md">The Audit Trail module has been removed from this node per system configuration updates.</p>
      <Button asChild className="mt-8" variant="outline">
          <Link href="/">Return to Command Center</Link>
      </Button>
    </div>
  );
}
