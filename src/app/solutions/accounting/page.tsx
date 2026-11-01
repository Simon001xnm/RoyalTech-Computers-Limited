'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, PieChart, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';

export default function AccountingSolutionPage() {
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
                <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-full shadow-lg">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Financial Intelligence Node</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
                    Financial Mastery & <br />
                    <span className="text-green-600">Unified Ledger.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">
                    Engineered for Kenyan SMEs. Track every shilling with automated P&L reports, expense management, and KRA-ready auditing.
                </p>
                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-black uppercase tracking-widest text-[11px] shadow-xl rounded-2xl bg-green-600 hover:bg-green-700 text-white border-none">Start Free Audit</Button>
                    <Button variant="outline" className="h-14 px-10 font-black uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/50">View Features</Button>
                </div>
            </motion.div>
            <motion.div 
                className="relative bg-white/70 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-2xl ring-1 ring-black/5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <img src={placeholderImages.branding.dashboard_preview.url} alt="Financial Dashboard" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
            </motion.div>
        </section>

        {/* FINANCIAL PILLARS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
                { title: 'Automated P&L', desc: 'Real-time profit and loss tracking for your shop.', icon: PieChart },
                { title: 'Tax Readiness', desc: 'Generate KRA-compliant summaries in one click.', icon: ShieldCheck },
                { title: 'Expense Feed', desc: 'Track every shop expenditure as it happens.', icon: TrendingUp },
            ].map((f, i) => (
                <div key={i} className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-sm hover:shadow-xl transition-all group">
                    <div className="bg-green-600/5 p-4 rounded-2xl w-fit group-hover:bg-green-600 group-hover:text-white transition-colors mb-6">
                        <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
                </div>
            ))}
        </section>

        {/* CTA */}
        <section className="bg-black text-white p-12 sm:p-20 rounded-[3rem] text-center space-y-8 relative overflow-hidden shadow-2xl border-b-8 border-green-600">
            <div className="relative z-10 space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Secure Your Financial Node</h2>
                <p className="text-gray-400 font-medium text-sm max-w-2xl mx-auto">Professional accounting logic integrated into your daily shop operations.</p>
                <div className="pt-6">
                    <Button className="h-16 px-12 bg-green-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-green-700 transition-all border-none">Activate Accounting Silo</Button>
                </div>
            </div>
        </section>
      </div>
    </MarketingWrapper>
  );
}