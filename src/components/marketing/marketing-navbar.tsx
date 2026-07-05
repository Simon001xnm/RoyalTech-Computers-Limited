'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export function MarketingNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shadow-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase hidden sm:block">ShopManager</span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-muted-foreground">
            <Link href="/#products" className="hover:text-primary transition-colors">Products</Link>
            <Link href="/company/about" className="hover:text-primary transition-colors">Solutions</Link>
            <Link href="/support/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="font-bold hidden sm:flex text-primary">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="font-black uppercase tracking-widest shadow-xl px-8 h-11 bg-accent text-accent-foreground hover:bg-accent/90 border-none">
              <Link href="/signup">Get Started For Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
