'use client';

import React from 'react';
import { MarketingNavbar } from './marketing-navbar';
import { MarketingFooter } from './marketing-footer';

interface MarketingWrapperProps {
  children: React.ReactNode;
}

export function MarketingWrapper({ children }: MarketingWrapperProps) {
  return (
    <div className="min-h-screen bg-white text-black selection:bg-primary selection:text-white">
      <MarketingNavbar />
      <main className="pt-20">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
