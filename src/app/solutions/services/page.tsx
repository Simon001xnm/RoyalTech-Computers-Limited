'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { Settings2, Scissors, Calendar, ShieldCheck, CheckCircle2, Zap, UserCheck, Clock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function ServicesSolutionPage() {
  const floatingGlass = "bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.25)] rounded-[2.5rem]";

  const process = [
    { title: 'Booking', desc: 'Clients book slots via your digital portal or staff enter walk-ins manually.', icon: Calendar },
    { title: 'Roster Match', desc: 'The system assigns available staff and tracks their service time.', icon: UserCheck },
    { title: 'History Log', desc: 'Every service is pinned to the client profile for future personalization.', icon: History }
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
                <div className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-1.5 rounded-full shadow-xl ring-4 ring-purple-600/20">
                    <Scissors className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Services & Appointment Hub</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-none text-shadow-md">
                    Appointments <br />
                    <span className="text-purple-600">& Service Flows.</span>
                </h1>
                
                <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl max-w-xl mx-auto lg:mx-0 group hover:bg-white/15 transition-all">
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed opacity-90 text-shadow-sm">
                        Designed for Salons, Spas, and Consultancies. Manage your roster, track staff commissions, and automate customer bookings with ease.
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-[0_15px_30px_rgba(147,51,234,0.3)] rounded-2xl bg-purple-600 hover:bg-purple-700 text-white border-none">Get Started</Button>
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
                    <img src={placeholderImages.branding.support_section.url} alt="Service Management" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
                </Card>
            </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-bold uppercase text-[9px] tracking-widest px-4 h-7 border-purple-200 text-purple-600 bg-white/50 shadow-sm">Service Logic</Badge>
                <h2 className="text-3xl font-bold uppercase tracking-tight text-shadow-sm">How the Service System Works</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-90">Automating the client experience from first booking to final checkout.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {process.map((step, i) => (
                    <div key={i} className={cn(floatingGlass, "p-8 relative group hover:-translate-y-2 transition-all")}>
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xl">{i + 1}</div>
                        <div className="bg-purple-600/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500 shadow-inner">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* FEATURE GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
             {[
                { title: 'Booking Engine', desc: 'Automated appointment slots with SMS reminders.', icon: Calendar },
                { title: 'Staff Roster', desc: 'Track attendance and commission-based payouts.', icon: Zap },
                { title: 'Client History', desc: 'Detailed profiles of past services and preferences.', icon: ShieldCheck },
            ].map((f, i) => (
                <div key={i} className={cn(floatingGlass, "p-8 space-y-4 hover:shadow-2xl transition-all group shadow-[0_15px_30px_rgba(0,0,0,0.1)]")}>
                    <div className="bg-purple-600/5 p-4 rounded-2xl w-fit group-hover:bg-purple-600 group-hover:text-white transition-colors mb-6 shadow-inner">
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
