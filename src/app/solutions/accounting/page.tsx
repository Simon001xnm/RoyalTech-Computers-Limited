'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, PieChart, TrendingUp, ShieldCheck, CheckCircle2, LineChart, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function AccountingSolutionPage() {
  const floatingGlass = "bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.25)] rounded-[2.5rem]";

  const steps = [
    { title: 'Data Ingestion', desc: 'Daily sales from your POS and expenses from your ledger are synced automatically.', icon: Database },
    { title: 'Audit Engine', desc: 'The system computes taxes (VAT/CIT) and classifies costs into your profit reports.', icon: Calculator },
    { title: 'Reporting', desc: 'Generate KRA-ready audit statements and graphical performance reviews in seconds.', icon: LineChart }
  ];

  return (
    <MarketingWrapper>
      <div className="max-w-7xl mx-auto px-6 space-y-24">
        {/* HERO */}
        <section className="pt-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-full shadow-xl ring-4 ring-green-600/20">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Financial Analytics Hub</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-none text-shadow-md">
                    Financial Mastery & <br />
                    <span className="text-green-600">Unified Ledger.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed opacity-90 drop-shadow-sm">
                    Engineered for Kenyan SMEs. Track every shilling with automated reports, expense management, and KRA-ready auditing.
                </p>
                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-[0_15px_30px_rgba(22,163,74,0.3)] rounded-2xl bg-green-600 hover:bg-green-700 text-white border-none">Start Free Audit</Button>
                    <Button variant="outline" className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg">View Features</Button>
                </div>
            </motion.div>
            <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <Card className={cn(floatingGlass, "p-4 relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.3)]")}>
                    <img src={placeholderImages.branding.dashboard_preview.url} alt="Financial Dashboard" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
                </Card>
            </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-bold uppercase text-[9px] tracking-widest px-4 h-7 border-green-200 text-green-600 bg-white/50 shadow-sm">Audit Flow</Badge>
                <h2 className="text-3xl font-bold uppercase tracking-tight text-shadow-sm">How Accounting Tools Work</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-90">Turning raw transaction data into boardroom-ready intelligence.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step, i) => (
                    <div key={i} className={cn(floatingGlass, "p-8 relative group hover:-translate-y-2 transition-all")}>
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xl">{i + 1}</div>
                        <div className="bg-green-600/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors duration-500 shadow-inner">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* FINANCIAL PILLARS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
             {[
                { title: 'Automated Reports', desc: 'Real-time profit and loss tracking for your shop.', icon: PieChart },
                { title: 'Tax Readiness', desc: 'Generate KRA-compliant summaries in one click.', icon: ShieldCheck },
                { title: 'Expense Feed', desc: 'Track every shop expenditure as it happens.', icon: TrendingUp },
            ].map((f, i) => (
                <div key={i} className={cn(floatingGlass, "p-8 space-y-4 hover:shadow-2xl transition-all group shadow-[0_15px_30px_rgba(0,0,0,0.1)]")}>
                    <div className="bg-green-600/5 p-4 rounded-2xl w-fit group-hover:bg-green-600 group-hover:text-white transition-colors mb-6 shadow-inner">
                        <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">{f.desc}</p>
                </div>
            ))}
        </section>
      </div>
    </MarketingWrapper>
  );
}
