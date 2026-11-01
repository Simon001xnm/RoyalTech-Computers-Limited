'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Users, Calculator, ShieldCheck, CheckCircle2, UserPlus, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';

export default function SchoolSolutionPage() {
  const flow = [
    { title: 'Admissions', desc: 'Capture student bio-data and parent contacts in a secure digital silo.', icon: UserPlus },
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
                <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-lg">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Academic Excellence Node</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
                    Integrated School <br />
                    <span className="text-blue-600">Management Systems.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed opacity-80">
                    A sophisticated platform for modern Kenyan schools. Centralize student records, fee collection, and academic results in one secure cloud environment.
                </p>
                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-xl rounded-2xl bg-blue-600 hover:bg-blue-700 text-white border-none">Request a Demo</Button>
                    <Button variant="outline" className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/50 backdrop-blur-sm">View Pricing</Button>
                </div>
            </motion.div>
            <motion.div 
                className="relative bg-white/70 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-2xl ring-1 ring-black/5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <img src={placeholderImages.branding.dashboard_preview.url} alt="School Dashboard" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
            </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest px-4 h-7 border-blue-200 text-blue-600">Platform Logic</Badge>
                <h2 className="text-3xl font-black uppercase tracking-tight">How Academic Node Works</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-80">Streamlining the administrative lifecycle of your institution.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {flow.map((step, i) => (step &&
                    <div key={i} className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-xl relative group">
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg">{i + 1}</div>
                        <div className="bg-blue-600/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* ACADEMIC MODULES */}
        <section className="space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Complete Academic Oversight</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-80">Powerful modules designed to handle administrative complexity with ease.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Fees Ledger', desc: 'Automated billing and real-time M-Pesa reconciliation.', icon: Calculator },
                    { title: 'Exams Portal', desc: 'Process results and generate report forms instantly.', icon: BookOpen },
                    { title: 'Admissions', desc: 'Paperless registration for new student onboarding.', icon: Users },
                    { title: 'Security', desc: 'Secure silos for student and administrative data.', icon: ShieldCheck },
                ].map((m, i) => (
                    <div key={i} className="bg-white/50 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-sm hover:shadow-xl transition-all group">
                        <div className="bg-blue-600/5 p-4 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors mb-4">
                            <m.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-tight mb-2">{m.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed opacity-80">{m.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* CTA */}
        <section className="bg-black text-white p-12 sm:p-20 rounded-[3rem] text-center space-y-8 relative overflow-hidden shadow-2xl border-b-8 border-blue-600">
            <div className="relative z-10 space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Digitalize Your Institution</h2>
                <p className="text-gray-400 font-medium text-sm max-w-2xl mx-auto opacity-80">Join leading academic institutions in Nairobi using Business Hub to streamline their operations.</p>
                <div className="pt-6">
                    <Button className="h-16 px-12 bg-blue-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-blue-700 transition-all border-none">Book Academic Consultation</Button>
                </div>
            </div>
        </section>
      </div>
    </MarketingWrapper>
  );
}