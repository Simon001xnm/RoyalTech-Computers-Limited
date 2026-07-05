'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="py-24 px-6 bg-white border-t border-black/5">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 md:gap-8">
        <div className="col-span-2 lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-black uppercase tracking-tighter">ShopManager</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
            The professional choice for businesses seeking scale, stability, and privacy in the cloud.
          </p>
        </div>

        <div className="space-y-4">
          <h5 className="font-black uppercase tracking-widest text-[10px]">Apps & Solutions</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/solutions/crm" className="hover:text-primary transition-colors">CRM Platform</Link></li>
            <li><Link href="/solutions/accounting" className="hover:text-primary transition-colors">Accounting Tools</Link></li>
            <li><Link href="/solutions/mail" className="hover:text-primary transition-colors">Mail & Workspace</Link></li>
            <li><Link href="/solutions/mobile" className="hover:text-primary transition-colors">Mobile Integration</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-black uppercase tracking-widest text-[10px]">Learn</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/resources/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
            <li><Link href="/resources/academy" className="hover:text-primary transition-colors">Academy</Link></li>
            <li><Link href="/resources/blog" className="hover:text-primary transition-colors">Blog & News</Link></li>
            <li><Link href="/resources/community" className="hover:text-primary transition-colors">Community</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-black uppercase tracking-widest text-[10px]">Support</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/support/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            <li><Link href="/support/status" className="hover:text-primary transition-colors">Service Status</Link></li>
            <li><Link href="/support/kb" className="hover:text-primary transition-colors">Knowledge Base</Link></li>
            <li><Link href="/support/security" className="hover:text-primary transition-colors">Security Compliance</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-black uppercase tracking-widest text-[10px]">Company</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/company/about" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link href="/company/story" className="hover:text-primary transition-colors">Our Story</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-black/5 flex flex-col items-center gap-8">
        <p className="text-[10px] text-muted-foreground tracking-widest text-center lowercase">
          &copy; 2026 shopmanager suite &bull; powered by simonstyless technologies limited
        </p>
      </div>
    </footer>
  );
}
