"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileJson, FileText, Download, ShieldCheck, PieChart, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function KraModule() {
  const reports = [
    { title: "VAT 3 Return Summary", type: "XML/CSV", date: "Oct 2026", status: "Ready" },
    { title: "Withholding Tax Ledger", type: "PDF", date: "Q3 2026", status: "Ready" },
    { title: "KRA iTax ZIP Bundle", type: "ZIP", date: "Monthly", status: "Scheduled" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tax Intelligence (KRA)" 
        description="Generate KRA-compliant iTax files and VAT reports for your business."
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
         <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Compliance Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black text-primary">VERIFIED</div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Tax PIN: P051XXXXXXX</p>
            </CardContent>
         </Card>
         <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    VAT Payable
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black text-green-700">KES 42,500</div>
                <p className="text-[10px] text-green-600/70 uppercase font-bold mt-1">Current period estimate</p>
            </CardContent>
         </Card>
         <Card className="bg-muted border-none ring-1 ring-black/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Next Deadline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black">NOV 20</div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Monthly VAT Return</p>
            </CardContent>
         </Card>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-sm font-black uppercase">Available iTax Exports</CardTitle>
                <CardDescription>Direct upload files for the KRA portal.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {reports.map((r, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-muted p-2.5 rounded-xl">
                                    <FileJson className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm uppercase">{r.title}</h4>
                                    <p className="text-[10px] text-muted-foreground font-medium">{r.type} &bull; {r.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-black text-[8px] h-5 uppercase">{r.status}</Badge>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="p-8 bg-black text-white rounded-[32px] text-center space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Automate your filings</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">Tired of manual excel sheets? Enable iTax direct-sync to push your daily sales data to KRA in real-time.</p>
          <Button className="bg-primary text-white font-black uppercase tracking-widest text-[10px] h-12 px-10">Connect KRA Portal</Button>
      </div>
    </div>
  );
}
