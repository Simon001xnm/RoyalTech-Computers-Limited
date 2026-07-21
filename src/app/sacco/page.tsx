"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Landmark, Users, CreditCard, ArrowUpRight, Search, PlusCircle, UserPlus, Wallet, History } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SaccoModule() {
  const members = [
    { id: "M001", name: "David Kariuki", shares: "45,000", loans: "0", status: "Active" },
    { id: "M002", name: "Mercy Wanjiku", shares: "120,500", loans: "30,000", status: "Active" },
    { id: "M003", name: "Samuel Otieno", shares: "12,000", loans: "5,000", status: "Arrears" },
  ];

  return (
    <div className="space-y-6 md:space-y-10">
      <PageHeader 
        title="Financial Node (SACCO)" 
        description="Unified ledger for member management, share capital, and automated loan processing."
        actionLabel="Register Member"
        onAction={() => {}}
        ActionIcon={UserPlus}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <SummaryCard title="Total Members" value="482" icon={Users} description="+12 this month" trend="+2.4%" />
        <SummaryCard title="Share Capital" value="KES 4.2M" icon={Landmark} description="Total pooled savings" trend="+15%" />
        <SummaryCard title="Active Loans" value="KES 1.8M" icon={CreditCard} description="Portfolio at risk: 2%" trend="-0.5%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-4 px-6">
                <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Member Registry
                    </CardTitle>
                </div>
                <div className="relative w-48 sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input placeholder="Find member..." className="pl-9 h-9 text-xs bg-background" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-muted/30">
                            <tr className="text-left">
                                <th className="py-3 px-6 text-[10px] font-black uppercase">ID</th>
                                <th className="py-3 px-6 text-[10px] font-black uppercase">Member Name</th>
                                <th className="py-3 px-6 text-right text-[10px] font-black uppercase">Shares (KES)</th>
                                <th className="py-3 px-6 text-right text-[10px] font-black uppercase">Loans (KES)</th>
                                <th className="py-3 px-6 text-center text-[10px] font-black uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {members.map(m => (
                                <tr key={m.id} className="hover:bg-muted/10 transition-colors group cursor-pointer">
                                    <td className="py-4 px-6 font-mono text-[10px] opacity-60">{m.id}</td>
                                    <td className="py-4 px-6 font-black uppercase text-xs">{m.name}</td>
                                    <td className="py-4 px-6 text-right font-bold text-xs">{m.shares}</td>
                                    <td className="py-4 px-6 text-right font-bold text-xs">{m.loans}</td>
                                    <td className="py-4 px-6 text-center">
                                        <Badge variant={m.status === 'Active' ? 'default' : 'destructive'} className="text-[8px] font-black h-4 px-2 uppercase">
                                            {m.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/5 border-t py-3 justify-center">
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest h-8">View All Members <ArrowUpRight className="ml-1.5 h-3 w-3" /></Button>
            </CardFooter>
        </Card>
        
        <div className="space-y-6">
            <Card className="border-none shadow-lg ring-1 ring-black/5 bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest opacity-60">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-4xl font-black tracking-tighter">8</div>
                    <p className="text-[10px] font-bold uppercase opacity-80 leading-relaxed">Loan requests awaiting vetting from the board committee.</p>
                </CardContent>
                <CardFooter className="pt-0 pb-6">
                    <Button variant="secondary" className="w-full h-11 font-black uppercase tracking-widest text-[10px] shadow-lg">Vetting Module</Button>
                </CardFooter>
            </Card>

            <Card className="border-none shadow-lg ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-muted/20 border-b">
                    <CardTitle className="text-xs font-black uppercase">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-2 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-20 flex-col gap-2 font-black uppercase text-[9px] tracking-widest border-none bg-muted/30 hover:bg-primary hover:text-white transition-all">
                        <Wallet className="h-5 w-5" />
                        Deposit
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2 font-black uppercase text-[9px] tracking-widest border-none bg-muted/30 hover:bg-primary hover:text-white transition-all">
                        <CreditCard className="h-5 w-5" />
                        Withdraw
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2 font-black uppercase text-[9px] tracking-widest border-none bg-muted/30 hover:bg-primary hover:text-white transition-all">
                        <PlusCircle className="h-5 w-5" />
                        Issue Loan
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2 font-black uppercase text-[9px] tracking-widest border-none bg-muted/30 hover:bg-primary hover:text-white transition-all">
                        <History className="h-5 w-5" />
                        Statement
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="p-8 bg-black text-white rounded-[32px] text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Landmark className="h-60 w-60" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Unified Financial Control</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium">ShopManager SACCO node handles the complex arithmetic of dividends, loan interest, and share capital instantly.</p>
          <div className="pt-4 flex justify-center gap-3">
            <Badge variant="outline" className="text-primary border-primary font-black">INTEREST: 12% P.A</Badge>
            <Badge variant="outline" className="text-primary border-primary font-black">DIVIDENDS: AUTO-CALC</Badge>
          </div>
      </div>
    </div>
  );
}
