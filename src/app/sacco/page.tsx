"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Users, CreditCard, ArrowUpRight } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/summary-card";

export default function SaccoModule() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Financial Node (SACCO)" 
        description="Manage members, share capital, and loan processing for your cooperative."
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <SummaryCard title="Total Members" value="482" icon={Users} description="+12 this week" />
        <SummaryCard title="Total Savings" value="KES 4.2M" icon={Landmark} description="Cash at hand" />
        <SummaryCard title="Active Loans" value="KES 1.8M" icon={CreditCard} description="Portfolio at risk: 2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl ring-1 ring-black/5">
            <CardHeader className="border-b bg-muted/10">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center justify-between">
                    Member Registry
                    <ArrowUpRight className="h-4 w-4" />
                </CardTitle>
            </CardHeader>
            <CardContent className="p-12 text-center opacity-20">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p className="font-bold text-[10px] uppercase">Registry Synced</p>
            </CardContent>
        </Card>
        
        <Card className="border-none shadow-xl ring-1 ring-black/5">
            <CardHeader className="border-b bg-muted/10">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center justify-between">
                    Loan Processing
                    <ArrowUpRight className="h-4 w-4" />
                </CardTitle>
            </CardHeader>
            <CardContent className="p-12 text-center opacity-20">
                <CreditCard className="h-12 w-12 mx-auto mb-4" />
                <p className="font-bold text-[10px] uppercase">Loan Queue Idle</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
