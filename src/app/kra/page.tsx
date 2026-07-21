"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileJson, FileText, Download, ShieldCheck, PieChart, Activity, FileSpreadsheet, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function KraModule() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const reports = [
    { id: 'vat3', title: "VAT 3 Return Summary", type: "XML/CSV", date: "Oct 2026", status: "Ready" },
    { id: 'wht', title: "Withholding Tax Ledger", type: "PDF", date: "Q3 2026", status: "Ready" },
    { id: 'itax', title: "KRA iTax ZIP Bundle", type: "ZIP", date: "Monthly", status: "Scheduled" }
  ];

  const handleExport = (reportId: string) => {
    setIsExporting(reportId);
    setTimeout(() => {
        setIsExporting(null);
        toast({ title: "Export Complete", description: "The KRA compliant file has been generated." });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tax Intelligence (KRA)" 
        description="Generate KRA-compliant iTax files and VAT reports directly from your cloud sales ledger."
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
         <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Compliance Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black text-primary">VERIFIED</div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Tax PIN: P051XXXXXXX</p>
            </CardContent>
         </Card>
         <Card className="bg-green-50 border-green-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    VAT Payable
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black text-green-700">KES 42,500</div>
                <p className="text-[10px] text-green-600/70 uppercase font-bold mt-1">Current period estimate</p>
            </CardContent>
         </Card>
         <Card className="border-none ring-1 ring-black/5 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Next Filing
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black">NOV 20</div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">VAT Return Deadline</p>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Available iTax Exports</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase mt-1">Direct upload files for the KRA portal.</CardDescription>
                    </div>
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground opacity-20" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {reports.map((r) => (
                        <div key={r.id} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className="bg-muted p-3 rounded-2xl">
                                    <FileJson className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-tight">{r.title}</h4>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">{r.type} &bull; {r.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="font-black text-[8px] h-5 uppercase px-2">{r.status}</Badge>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-10 px-4 font-bold border-2"
                                    onClick={() => handleExport(r.id)}
                                    disabled={!!isExporting}
                                >
                                    {isExporting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                    {isExporting === r.id ? 'Generating...' : 'Export'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="bg-muted/5 border-t py-4 justify-center">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                    Data synced from official cloud ledger &bull; 100% compliant
                </p>
            </CardFooter>
        </Card>

        <Card className="bg-black text-white border-none shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <ShieldCheck className="h-40 w-40" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Automate Filing</CardTitle>
                <CardDescription className="text-gray-400 font-bold text-[10px]">REAL-TIME ITX CONNECT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-sm text-gray-300 leading-relaxed">Tired of manual excel sheets? Enable iTax direct-sync to push your daily sales data to KRA in real-time.</p>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        <CheckCircle2 className="h-3 w-3" /> No more manual entries
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        <CheckCircle2 className="h-3 w-3" /> Audit-ready history
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        <CheckCircle2 className="h-3 w-3" /> Instant VAT calculation
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full h-12 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl">
                    Connect Portal
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    )
}
