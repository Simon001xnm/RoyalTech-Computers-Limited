'use client';

import React, { useState, useEffect } from 'react';
import { MarketingNavbar } from './marketing-navbar';
import { MarketingFooter } from './marketing-footer';
import { cn } from '@/lib/utils';

interface MarketingWrapperProps {
  children: React.ReactNode;
}

/**
 * @fileOverview Marketing Wrapper with Local Theme Control
 * Handles the light/dark state specifically for the public landing pages.
 */
export function MarketingWrapper({ children }: MarketingWrapperProps) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={cn(
        "min-h-screen transition-colors duration-500 selection:bg-[#eab308] selection:text-black",
        isDark ? "bg-[#0a0a0a] text-white dark" : "bg-white text-black"
    )}>
      <MarketingNavbar isDark={isDark} onToggleTheme={toggleTheme} />
      <main className="pt-20">
        {children}
      </main>
      <MarketingFooter isDark={isDark} />
    </div>
  );
}
