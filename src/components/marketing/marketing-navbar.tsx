'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MarketingNavbarProps {
    isDark: boolean;
    onToggleTheme: () => void;
}

export function MarketingNavbar({ isDark, onToggleTheme }: MarketingNavbarProps) {
  return (
    <nav className={cn(
        "fixed top-0 w-full z-50 transition-all border-b",
        isDark ? "bg-[#0a0a0a]/90 border-white/5" : "bg-white/90 border-black/5",
        "backdrop-blur-md"
    )}>
      <div className={cn(
        "max-w-7xl mx-auto px-6 h-20 flex items-center justify-between",
        isDark ? "text-white" : "text-black"
      )}>
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-[#1a1a1a] p-2 rounded-xl shadow-lg ring-1 ring-[#eab308]/20">
            <Zap className="h-6 w-6 text-[#eab308]" />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase hidden sm:block">BusinessHub</span>
        </Link>
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest">
            <Link href="/#products" className={cn("transition-colors", isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black")}>Products</Link>
            <Link href="/company/about" className={cn("transition-colors", isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black")}>Solutions</Link>
            <Link href="/support/contact" className={cn("transition-colors", isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black")}>Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleTheme}
                className={cn(
                    "rounded-full transition-colors h-10 w-10",
                    isDark ? "text-[#eab308] hover:bg-white/5" : "text-black/60 hover:bg-black/5"
                )}
            >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button asChild variant="outline" className={cn(
                "font-black uppercase text-[10px] tracking-widest px-6 h-11 border-2 transition-all hidden sm:flex",
                isDark ? "border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10" : "border-[#22c55e]/20 text-[#15803d] hover:bg-[#22c55e]/5"
            )}>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="font-black uppercase text-[10px] tracking-widest shadow-xl px-6 h-11 bg-[#22c55e] text-white hover:bg-[#16a34a] border-none active:scale-95 transition-all">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
