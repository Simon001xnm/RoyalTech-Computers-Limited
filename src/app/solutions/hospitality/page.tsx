'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { Utensils, Monitor, Clock, CreditCard, CheckCircle2, Wine, ChefHat, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function HospitalitySolutionPage() {
  const floatingGlass = "bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.25)] rounded-[2.5rem]";

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
                <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-1.5 rounded-full shadow-xl ring-4 ring-orange-500/20">
                    <Utensils className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Hospitality Hub</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-none text-shadow-md">
                    Seamless Dining <br />
                    <span className="text-orange-500">& Table Control.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed opacity-90 drop-shadow-sm">
                    Designed for Nairobi's vibrant culinary scene. Manage tables, automate kitchen orders, and process bills with integrated M-Pesa payments.
                </p>
                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-[0_15px_30px_rgba(249,115,22,0.3)] rounded-2xl bg-orange-500 hover:bg-orange-600 text-white border-none">Get Started</Button>
                    <Button variant="outline" className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg">Request Demo</Button>
                </div>
            </motion.div>
            <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <Card className={cn(floatingGlass, "p-4 relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.3)]")}>
                    <img src={placeholderImages.branding.solutions_showcase.url} alt="Hospitality Management" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
                </Card>
            </motion.div>
        </section>

        {/* WORKFLOW */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-bold uppercase text-[9px] tracking-widest px-4 h-7 border-orange-200 text-orange-600 bg-white/50 shadow-sm">Operations Flow</Badge>
                <h2 className="text-3xl font-bold uppercase tracking-tight text-shadow-sm">How the Hospitality Hub Works</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-90">A paperless ecosystem for restaurants, bars, and lounges.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step, i) => (
                    <div key={i} className={cn(floatingGlass, "p-8 relative group hover:-translate-y-2 transition-all")}>
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xl">{i + 1}</div>
                        <div className="bg-orange-500/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-500 shadow-inner">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* CORE FEATURES */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-20">
            <div className={cn(floatingGlass, "p-10 space-y-6 group hover:shadow-2xl transition-all")}>
                <Badge className="bg-orange-500 text-white font-bold uppercase text-[9px] shadow-sm">Table Management</Badge>
                <h2 className="text-3xl font-bold uppercase tracking-tight leading-none text-shadow-sm">Real-time Layout Control</h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">
                    Visualize your entire floor. See which tables are occupied, which bills are ready, and manage your servers with one intuitive dashboard.
                </p>
                <ul className="space-y-3 pt-2">
                    {['Split billing support', 'Waiter performance tracking', 'Reservations portal'].map(item => (
                        <li key={item} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight">
                            <div className="p-1 bg-orange-500/10 rounded-full"><CheckCircle2 className="h-4 w-4 text-orange-500" /></div> {item}
                        </li>
                    ))}
                </ul>
            </div>
            <div className={cn(floatingGlass, "p-10 space-y-6 group hover:shadow-2xl transition-all")}>
                <Badge className="bg-orange-500 text-white font-bold uppercase text-[9px] shadow-sm">Kitchen Display</Badge>
                <h2 className="text-3xl font-bold uppercase tracking-tight leading-none text-shadow-sm">Paperless Kitchen Flow</h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">
                    Eliminate order errors. Orders from the table go directly to the kitchen display node, updating chefs instantly on modifications.
                </p>
                <ul className="space-y-3 pt-2">
                    {['Timer alerts for delays', 'Recipe management', 'Ingredient level tracking'].map(item => (
                        <li key={item} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight">
                            <div className="p-1 bg-orange-500/10 rounded-full"><CheckCircle2 className="h-4 w-4 text-orange-500" /></div> {item}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
      </div>
    </MarketingWrapper>
  );
}
