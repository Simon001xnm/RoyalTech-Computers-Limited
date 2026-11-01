'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Users, Calculator, ShieldCheck, CheckCircle2, UserPlus, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function SchoolSolutionPage() {
  const floatingGlass = "bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.25)] rounded-[2.5rem]";

  const flow = [
    { title: 'Admissions', desc: 'Capture student bio-data and parent contacts in a secure digital storage hub.', icon: UserPlus },
    { title: 'Fee Management', desc: 'Generate invoices based on class or student status. Sync payments via M-Pesa.', icon: CreditCard },
    { title: 'Academic Audit', desc: 'Teachers input grades; the system computes averages and generates report forms.', icon: FileText }
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
                <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-xl ring-4 ring-blue-600/20">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Academic Excellence Hub</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-none text-shadow-md">
                    Integrated School <br />
                    <span className="text-blue-600">Management System.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed opacity-90 drop-shadow-sm">
                    A sophisticated platform for modern Kenyan schools. Centralize student records, fee collection, and academic results in one secure cloud environment.
                </p>
                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-[0_15px_30px_rgba(37,99,235,0.3)] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white border-none">Request a Demo</Button>
                    <Button variant="outline" className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg">View Pricing</Button>
                </div>
            </motion.div>
            <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <Card className={cn(floatingGlass, "p-4 relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.3)]")}>
                    <img src={placeholderImages.branding.dashboard_preview.url} alt="School Dashboard" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
                </Card>
            </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-bold uppercase text-[9px] tracking-widest px-4 h-7 border-blue-200 text-blue-600 bg-white/50 shadow-sm">Platform Logic</Badge>
                <h2 className="text-3xl font-bold uppercase tracking-tight text-shadow-sm">How the Management System Works</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-90">Streamlining the administrative lifecycle of your institution.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {flow.map((step, i) => (step &&
                    <div key={i} className={cn(floatingGlass, "p-8 relative group hover:-translate-y-2 transition-all")}>
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xl">{i + 1}</div>
                        <div className="bg-blue-600/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-inner">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* ACADEMIC MODULES */}
        <section className="space-y-12 pb-20">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold uppercase tracking-tight text-foreground text-shadow-sm">Complete Academic Oversight</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-90">Powerful modules designed to handle administrative complexity with ease.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Fees Ledger', desc: 'Automated billing and real-time M-Pesa reconciliation.', icon: Calculator },
                    { title: 'Exams Portal', desc: 'Process results and generate report forms instantly.', icon: BookOpen },
                    { title: 'Admissions', desc: 'Paperless registration for new student onboarding.', icon: Users },
                    { title: 'Security', desc: 'Secure storage for student and administrative data.', icon: ShieldCheck },
                ].map((m, i) => (
                    <div key={i} className={cn(floatingGlass, "p-8 space-y-4 hover:shadow-2xl transition-all group shadow-[0_15px_30px_rgba(0,0,0,0.1)]")}>
                        <div className="bg-blue-600/5 p-4 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors mb-4 shadow-inner">
                            <m.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-bold uppercase tracking-tight mb-2">{m.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed opacity-90">{m.desc}</p>
                    </div>
                ))}
            </div>
        </section>
      </div>
    </MarketingWrapper>
  );
}
