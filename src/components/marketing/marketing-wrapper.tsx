'use client';

import React, { useState, useEffect } from 'react';
import { MarketingNavbar } from './marketing-navbar';
import { MarketingFooter } from './marketing-footer';
import { cn } from '@/lib/utils';

interface MarketingWrapperProps {
  children: React.ReactNode;
}

/**
 * @fileOverview Marketing Wrapper with Persistent Theme Control
 * Saves light/dark preference to localStorage for global application across marketing pages.
 */
export function MarketingWrapper({ children }: MarketingWrapperProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('marketing_theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('marketing_theme', newTheme ? 'dark' : 'light');
  };

  if (!mounted) return null;

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
