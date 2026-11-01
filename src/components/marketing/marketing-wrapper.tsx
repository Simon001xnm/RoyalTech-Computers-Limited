'use client';

import React, { useState, useEffect } from 'react';
import { MarketingNavbar } from './marketing-navbar';
import { MarketingFooter } from './marketing-footer';
import { cn } from '@/lib/utils';
import placeholderImages from '@/app/lib/placeholder-images.json';

interface MarketingWrapperProps {
  children: React.ReactNode;
}

/**
 * @fileOverview Premium Marketing Wrapper with High-Vibrancy Persistent Background
 * Implements a fixed background layer with content floating above it.
 * Removed all grayscale filters to ensure a rich, full-color experience.
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
        "min-h-screen relative transition-colors duration-700 selection:bg-[#eab308] selection:text-black",
        isDark ? "bg-[#0a0a0a] text-white dark" : "bg-white text-black"
    )}>
      {/* PERSISTENT FULL-COLOR BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0">
          <img 
            src={placeholderImages.branding.login_bg.url} 
            alt="Premium Business Infrastructure in Kenya" 
            className="w-full h-full object-cover opacity-80 transition-opacity duration-1000"
          />
          <div className={cn(
            "absolute inset-0 transition-colors duration-1000",
            isDark 
              ? "bg-gradient-to-br from-black via-black/20 to-transparent" 
              : "bg-gradient-to-br from-white via-white/20 to-transparent"
          )} />
      </div>

      {/* FLOATING CONTENT LAYER */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <MarketingNavbar isDark={isDark} onToggleTheme={toggleTheme} />
        <main className="flex-grow pt-24 pb-20">
          {children}
        </main>
        <MarketingFooter isDark={isDark} />
      </div>
    </div>
  );
}
