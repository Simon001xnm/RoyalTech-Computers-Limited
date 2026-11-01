'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { Utensils, Monitor, Clock, CreditCard, CheckCircle2, Wine, ChefHat, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';

export default function HospitalitySolutionPage() {
  const steps = [
    { title: 'Floor Control', desc: 'Servers select active tables from a live digital map of your establishment.', icon: Monitor },
    { title: 'Instant KDS', desc: 'Orders are beamed to the kitchen display node instantly. No more paper chits.', icon: ChefHat },
    { title: 'M-Pesa Billing', desc: 'Generate bills and trigger M-Pesa STK pushes directly from the table.', icon: BellRing }
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
                <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-1.5 rounded-full shadow-lg">
                    <Utensils className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Hospitality Hub</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
                    Seamless Dining <br />
                    <span className="text-orange-500">& Table Control.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed opacity-80">
                    Designed for Nairobi's vibrant culinary scene. Manage tables, automate kitchen orders, and process bills with integrated M-Pesa payments.
                </p>
                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-xl rounded-2xl bg-orange-500 hover:bg-orange-600 text-white border-none">Get Started</Button>
                    <Button variant="outline" className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/50 backdrop-blur-sm">Request Demo</Button>
                </div>
            </motion.div>
            <motion.div 
                className="relative bg-white/70 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-2xl ring-1 ring-black/5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <img src={placeholderImages.branding.solutions_showcase.url} alt="Hospitality Management" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
            </motion.div>
        </section>

        {/* WORKFLOW */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest px-4 h-7 border-orange-200 text-orange-600">Operations Node</Badge>
                <h2 className="text-3xl font-black uppercase tracking-tight">How Hospitality Hub Works</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-80">A paperless ecosystem for restaurants, bars, and lounges.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-xl relative group">
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg">{i + 1}</div>
                        <div className="bg-orange-500/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-500">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* CORE FEATURES */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/20 shadow-xl space-y-6">
                <Badge className="bg-orange-500 text-white font-black uppercase text-[9px]">Table Management</Badge>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Real-time Layout Control</h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">
                    Visualize your entire floor. See which tables are occupied, which bills are ready, and manage your servers with one intuitive dashboard.
                </p>
                <ul className="space-y-3 pt-2">
                    {['Split billing support', 'Waiter performance tracking', 'Reservations portal'].map(item => (
                        <li key={item} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-tight">
                            <CheckCircle2 className="h-4 w-4 text-orange-500" /> {item}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/20 shadow-xl space-y-6">
                <Badge className="bg-orange-500 text-white font-black uppercase text-[9px]">Kitchen Display</Badge>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Paperless Kitchen Flow</h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">
                    Eliminate order errors. Orders from the table go directly to the kitchen display node, updating chefs instantly on modifications.
                </p>
                <ul className="space-y-3 pt-2">
                    {['Timer alerts for delays', 'Recipe management', 'Ingredient level tracking'].map(item => (
                        <li key={item} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-tight">
                            <CheckCircle2 className="h-4 w-4 text-orange-500" /> {item}
                        </li>
                    ))}
                </ul>
            </div>
        </section>

        {/* CTA */}
        <section className="bg-black text-white p-12 sm:p-20 rounded-[3rem] text-center space-y-8 relative overflow-hidden shadow-2xl border-b-8 border-orange-500">
            <div className="relative z-10 space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Improve Your Table Turnaround</h2>
                <p className="text-gray-400 font-medium text-sm max-w-2xl mx-auto opacity-80">Fast, reliable, and localized hospitality software for modern Kenyan establishments.</p>
                <div className="pt-6">
                    <Button className="h-16 px-12 bg-orange-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-orange-600 transition-all border-none">Deploy to My Establishment</Button>
                </div>
            </div>
        </section>
      </div>
    </MarketingWrapper>
  );
}