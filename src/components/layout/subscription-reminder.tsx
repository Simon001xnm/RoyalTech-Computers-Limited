'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

/**
 * @fileOverview High-Impact Subscription Expiry Reminder
 * Triggered globally to warn users about the Oct 1st deadline and data deletion risk.
 */
export function SubscriptionReminder() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // We use sessionStorage to show it once per session (per tab open/refresh)
    // so it doesn't block every single click, but remains highly visible.
    const hasSeen = sessionStorage.getItem('subscription_reminder_seen');
    if (!hasSeen) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('subscription_reminder_seen', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-none shadow-2xl ring-4 ring-destructive/10 no-print">
        <DialogHeader className="space-y-4">
          <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center animate-pulse">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase text-center tracking-tight">
            Urgent Notice
          </DialogTitle>
          <DialogDescription className="text-center text-sm font-medium leading-relaxed">
            <span className="font-black text-destructive text-lg block mb-2 underline underline-offset-4">
                FREE MODE EXPIRING: 1ST OCTOBER
            </span>
            Please be advised that your shop subscription is scheduled to expire on <span className="font-black">October 1st, 2026</span>. 
            <br /><br />
            <span className="p-4 bg-red-50 rounded-2xl block border-2 border-dashed border-red-200 text-red-900 font-bold italic text-xs">
              "System Policy: All shop records, customer ledgers, and financial documents will be PERMANENTLY DELETED if you opt to cancel your subscription or allow it to lapse."
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-col gap-3 mt-6">
          <Button asChild className="w-full h-14 font-black uppercase tracking-widest bg-destructive hover:bg-red-700 text-white shadow-xl transition-all active:scale-95">
            <Link href="/profile" onClick={handleDismiss}>Upgrade Subscription Now</Link>
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="w-full h-10 text-[9px] font-black uppercase opacity-40 hover:opacity-100 tracking-tighter">
            I understand the risk, remind me later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
