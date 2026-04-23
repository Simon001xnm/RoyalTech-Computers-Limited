
"use client";

import { SummaryCard } from "@/components/dashboard/summary-card";
import { DollarSign, BarChart3, ShieldCheck, Wallet } from "lucide-react";
import type { Asset } from "@/types";
import { useMemo } from "react";

interface ValuationSummaryProps {
  assets: Asset[];
}

/**
 * @fileOverview Asset Valuation Summary
 * Provides real-time financial auditing of hardware inventory.
 */
export function ValuationSummary({ assets }: ValuationSummaryProps) {
  const stats = useMemo(() => {
    // 1. Historical Investment (Everything ever bought)
    const totalCost = assets.reduce((acc, a) => acc + (a.purchasePrice || 0) * (a.quantity || 1), 0);
    
    // 2. Net Asset Value (What we still own - excludes Sold)
    const activeValue = assets
        .filter(a => a.status !== 'Sold')
        .reduce((acc, a) => acc + (a.purchasePrice || 0) * (a.quantity || 1), 0);
    
    // 3. Current Active Lease Income
    const leaseIncome = assets
        .filter(a => a.status === 'Leased')
        .reduce((acc, a) => acc + (a.leasePrice || 0) * (a.quantity || 1), 0);
    
    // 4. Total Monthly Potential (Current Leased + If Available were leased)
    const availableLeaseValue = assets
        .filter(a => a.status === 'Available')
        .reduce((acc, a) => acc + (a.leasePrice || 0) * (a.quantity || 1), 0);

    return {
      totalCost,
      activeValue,
      leaseIncome,
      totalLeasePotential: leaseIncome + availableLeaseValue
    };
  }, [assets]);

  const format = (val: number) => new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES', 
    maximumFractionDigits: 0 
  }).format(val);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <SummaryCard 
        title="Inventory NAV" 
        value={format(stats.activeValue)} 
        icon={ShieldCheck} 
        description="Net Asset Value (Excl. Sold)" 
      />
      <SummaryCard 
        title="Monthly Rent" 
        value={format(stats.leaseIncome)} 
        icon={Wallet} 
        description="Current recurring revenue" 
      />
      <SummaryCard 
        title="Lease Potential" 
        value={format(stats.totalLeasePotential)} 
        icon={BarChart3} 
        description="Potential if all items leased" 
      />
      <SummaryCard 
        title="Total Investment" 
        value={format(stats.totalCost)} 
        icon={DollarSign} 
        description="Total historical acquisition spend" 
      />
    </div>
  );
}
