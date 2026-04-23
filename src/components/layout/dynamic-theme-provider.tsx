'use client';

import React, { useEffect } from 'react';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSaaS } from '@/components/saas/saas-provider';

/**
 * Converts a hex color string to an HSL string compatible with Tailwind CSS variables.
 */
function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Injects CSS variables for branding colors based on the active tenant's settings.
 */
export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useSaaS();

  // Fetch the active tenant's company branding info
  const company = useLiveQuery(
    async () => tenant?.id ? await db.companies.get(tenant.id) : null,
    [tenant?.id]
  );

  useEffect(() => {
    const root = document.documentElement;
    
    if (company?.primaryColor) {
      const primaryHsl = hexToHsl(company.primaryColor);
      root.style.setProperty('--primary', primaryHsl);
      root.style.setProperty('--accent', primaryHsl);
      root.style.setProperty('--ring', primaryHsl);
      root.style.setProperty('--sidebar-primary', primaryHsl);
    } else {
      // Revert to default if no custom color (Navy Executive)
      root.style.setProperty('--primary', '220 40% 30%');
      root.style.setProperty('--accent', '220 40% 30%');
      root.style.setProperty('--ring', '220 40% 30%');
      root.style.setProperty('--sidebar-primary', '220 40% 45%');
    }
    
    if (company?.secondaryColor) {
      const secondaryHsl = hexToHsl(company.secondaryColor);
      root.style.setProperty('--secondary', secondaryHsl);
    } else {
      root.style.setProperty('--secondary', '210 40% 96%');
    }

  }, [company]);

  return <>{children}</>;
}
