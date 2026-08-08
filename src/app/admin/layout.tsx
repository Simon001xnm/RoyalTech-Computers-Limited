'use client';

import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center bg-background">
      <div className="bg-muted p-6 rounded-full mb-6">
          <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-20" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Module Decommissioned</h2>
      <p className="text-muted-foreground max-w-md">The Platform Command module has been removed from this node.</p>
      <Button asChild className="mt-8" variant="outline">
          <Link href="/">Return to Workspace</Link>
      </Button>
    </div>
  );
}
