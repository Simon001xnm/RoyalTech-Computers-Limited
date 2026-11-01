'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { Users, Target, MessageSquare, ShieldCheck, CheckCircle2, UserPlus, Fingerprint, Activity, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';

export default function CrmSolutionPage() {
  const steps = [
    { title: 'Identity Capture', desc: 'Create permanent silos for client details, aliases, and contact nodes.', icon: Fingerprint },
    { title: 'Activity Stream', desc: 'Track every purchase, payment, and support ticket assigned to the client.', icon: Activity },
    { title: 'Debt Oversight', desc: 'Automated monitoring of credit terms and unpaid balances with aging reports.', icon: Target }
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
                <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-1.5 rounded-full shadow-lg">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Client Identity Silo</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
                    Unified Client <br />
                    <span className="text-blue-500">& Debt Management.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed opacity-80">
                    Never lose a client contact. Manage profiles, track outstanding balances, and nurture relationships with Nairobi's most intuitive CRM.
                </p>
                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-xl rounded-2xl bg-blue-500 hover:bg-blue-600 text-white border-none">Register Client Node</Button>
                    <Button variant="outline" className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/50 backdrop-blur-sm">Explore Features</Button>
                </div>
            </motion.div>
            <motion.div 
                className="relative bg-white/70 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-2xl ring-1 ring-black/5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <img src={placeholderImages.branding.solutions_showcase.url} alt="CRM Overview" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
            </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest px-4 h-7 border-blue-200 text-blue-600">Identity Ledger</Badge>
                <h2 className="text-3xl font-black uppercase tracking-tight">How CRM Node Works</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-80">Centralizing every client interaction into one professional timeline.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-xl relative group">
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg">{i + 1}</div>
                        <div className="bg-blue-500/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-500">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* CRM FEATURES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
                { title: 'Identity Ledger', desc: 'Secure silos for all your customer contact data.', icon: UserPlus },
                { title: 'Debt Tracking', desc: 'Automated monitoring of credit sales and aging debt.', icon: Target },
                { title: 'Engagement', desc: 'Integrated chat and communication logs for your team.', icon: MessageSquare },
            ].map((f, i) => (
                <div key={i} className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-sm hover:shadow-xl transition-all group">
                    <div className="bg-blue-500/5 p-4 rounded-2xl w-fit group-hover:bg-blue-500 group-hover:text-white transition-colors mb-6">
                        <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">{f.desc}</p>
                </div>
            ))}
        </section>

        {/* CTA */}
        <section className="bg-black text-white p-12 sm:p-20 rounded-[3rem] text-center space-y-8 relative overflow-hidden shadow-2xl border-b-8 border-blue-500">
            <div className="relative z-10 space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Consolidate Your Client List</h2>
                <p className="text-gray-400 font-medium text-sm max-w-2xl mx-auto opacity-80">Professional CRM logic for organizations requiring strict account management.</p>
                <div className="pt-6">
                    <Button className="h-16 px-12 bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-blue-600 transition-all border-none">Deploy CRM Node</Button>
                </div>
            </div>
        </section>
      </div>
    </MarketingWrapper>
  );
}