'use client';

import React from 'react';
import { Zap, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MarketingFooterProps {
    isDark?: boolean;
}

/**
 * @fileOverview Glassmorphic Marketing Footer
 */
export function MarketingFooter({ isDark }: MarketingFooterProps) {
  return (
    <footer className={cn(
        "py-24 px-6 border-t transition-all",
        isDark 
            ? "bg-black/60 border-white/10 backdrop-blur-xl" 
            : "bg-white/60 border-black/5 backdrop-blur-xl"
    )}>
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 md:gap-8">
        <div className="col-span-2 lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#1a1a1a] p-2 rounded-xl ring-1 ring-[#eab308]/30">
              <Zap className="h-5 w-5 text-[#eab308]" />
            </div>
            <span className={cn("font-black uppercase tracking-tighter", isDark ? "text-white" : "text-black")}>BusinessHub</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px]">
            Engineered point of sale systems and local support for Nairobi business owners.
          </p>
        </div>

        <div className="space-y-4">
          <h5 className="font-bold uppercase tracking-widest text-[10px] opacity-40">Solutions</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/solutions/crm" className="hover:text-[#eab308] transition-colors">Client List</Link></li>
            <li><Link href="/solutions/accounting" className="hover:text-[#eab308] transition-colors">Money Tools</Link></li>
            <li><Link href="/solutions/mobile" className="hover:text-[#eab308] transition-colors">Mobile Checkout</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-bold uppercase tracking-widest text-[10px] opacity-40">Resources</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/resources/docs" className="hover:text-[#eab308] transition-colors">User Guides</Link></li>
            <li><Link href="/resources/blog" className="hover:text-[#eab308] transition-colors">Shop News</Link></li>
            <li><Link href="/support/status" className="hover:text-[#eab308] transition-colors">System Health</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-bold uppercase tracking-widest text-[10px] opacity-40">Headquarters</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li className={cn("flex items-center gap-2", isDark ? "text-white" : "text-black")}>
                <Phone className="h-3 w-3 text-[#eab308]" /> +254 758 673 616
            </li>
            <li className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-[#eab308]" /> <a href="mailto:info@simonstyles.co.ke" className="hover:text-[#eab308]">info@simonstyles.co.ke</a>
            </li>
            <li className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-[#eab308]" /> Nairobi, Kenya
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-bold uppercase tracking-widest text-[10px] opacity-40">Compliance</h5>
          <ul className="space-y-3 text-sm text-muted-foreground font-bold">
            <li><Link href="/legal/privacy" className="hover:text-[#eab308] transition-colors">Privacy Policy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-[#eab308] transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-muted-foreground/10 flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
            <p className={cn(
              "text-[10px] tracking-[0.05em] uppercase font-black",
              isDark ? "text-white" : "text-black"
            )}>
              © 2026 Simon Styles Corporation Pvt. Ltd. All Rights Reserved.
            </p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Premium Infrastructure Node &bull; Nairobi, KE
            </p>
        </div>
      </div>
    </footer>
  );
}
