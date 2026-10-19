'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MarketingFooterProps {
    isDark?: boolean;
}

export function MarketingFooter({ isDark }: MarketingFooterProps) {
  return (
    <footer className={cn(
        "py-24 px-6 border-t transition-colors",
        isDark ? "bg-[#0a0a0a] border-white/5" : "bg-white border-black/5"
    )}>
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 md:gap-8">
        <div className="col-span-2 lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#1a1a1a] p-2 rounded-xl ring-1 ring-[#eab308]/30">
              <Zap className="h-5 w-5 text-[#eab308]" />
            </div>
            <span className={cn("font-black uppercase tracking-tighter", isDark ? "text-white" : "text-black")}>BusinessHub</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
            The easy choice for shop owners who want to grow and keep their records safe online.
          </p>
        </div>

        <div className="space-y-4">
          <h5 className="font-black uppercase tracking-widest text-[10px] opacity-40">What We Do</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/solutions/crm" className="hover:text-[#eab308] transition-colors">Client List</Link></li>
            <li><Link href="/solutions/accounting" className="hover:text-[#eab308] transition-colors">Money Tools</Link></li>
            <li><Link href="/solutions/mail" className="hover:text-[#eab308] transition-colors">Messages</Link></li>
            <li><Link href="/solutions/mobile" className="hover:text-[#eab308] transition-colors">Mobile App</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-black uppercase tracking-widest text-[10px] opacity-40">Learn</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/resources/docs" className="hover:text-[#eab308] transition-colors">How to Use</Link></li>
            <li><Link href="/resources/academy" className="hover:text-[#eab308] transition-colors">Academy</Link></li>
            <li><Link href="/resources/blog" className="hover:text-[#eab308] transition-colors">Shop News</Link></li>
            <li><Link href="/resources/community" className="hover:text-[#eab308] transition-colors">User Group</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-black uppercase tracking-widest text-[10px] opacity-40">Get Help</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/support/contact" className="hover:text-[#eab308] transition-colors">Talk to Us</Link></li>
            <li><Link href="/support/status" className="hover:text-[#eab308] transition-colors">System Status</Link></li>
            <li><Link href="/support/kb" className="hover:text-[#eab308] transition-colors">Help Guides</Link></li>
            <li><Link href="/support/security" className="hover:text-[#eab308] transition-colors">Keeping Data Safe</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-black uppercase tracking-widest text-[10px] opacity-40">Company</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/company/about" className="hover:text-[#eab308] transition-colors">About Us</Link></li>
            <li><Link href="/company/story" className="hover:text-[#eab308] transition-colors">Our Story</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-[#eab308] transition-colors">Privacy Policy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-[#eab308] transition-colors">Shop Rules</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-muted-foreground/10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
            <p className={cn(
              "text-[11px] tracking-[0.05em] text-center uppercase font-black",
              isDark ? "text-white" : "text-black"
            )}>
              © 2026, Simon Styles Corporation Pvt. Ltd. All Rights Reserved.
            </p>
            <a 
                href="https://simonstyles.co.ke" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-[#eab308] transition-colors flex items-center gap-1.5"
            >
                Made in Kenya 
                <span className="text-base" role="img" aria-label="Kenya Flag">🇰🇪</span>
            </a>
        </div>
      </div>
    </footer>
  );
}
