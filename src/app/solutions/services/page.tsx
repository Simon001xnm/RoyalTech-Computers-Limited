'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { Settings2, Scissors, Calendar, ShieldCheck, CheckCircle2, Zap, UserCheck, Clock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';

export default function ServicesSolutionPage() {
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
                <div className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-1.5 rounded-full shadow-lg">
                    <Scissors className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Services & Appointment Hub</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
                    Appointments <br />
                    <span className="text-purple-600">& Service Flows.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed opacity-80">
                    Designed for Salons, Spas, and Consultancies. Manage your roster, track staff commissions, and automate customer bookings with ease.
                </p>
                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-xl rounded-2xl bg-purple-600 hover:bg-purple-700 text-white border-none">Get Started</Button>
                    <Button variant="outline" className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/50 backdrop-blur-sm">Request Demo</Button>
                </div>
            </motion.div>
            <motion.div 
                className="relative bg-white/70 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-2xl ring-1 ring-black/5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <img src={placeholderImages.branding.support_section.url} alt="Service Management" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
            </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest px-4 h-7 border-purple-200 text-purple-600">Service Logic</Badge>
                <h2 className="text-3xl font-black uppercase tracking-tight">How Service Node Works</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-80">Automating the client experience from first booking to final checkout.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {process.map((step, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-xl relative group">
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg">{i + 1}</div>
                        <div className="bg-purple-600/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* FEATURE GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
                { title: 'Booking Engine', desc: 'Automated appointment slots with SMS reminders.', icon: Calendar },
                { title: 'Staff Roster', desc: 'Track attendance and commission-based payouts.', icon: Zap },
                { title: 'Client History', desc: 'Detailed profiles of past services and preferences.', icon: ShieldCheck },
            ].map((f, i) => (
                <div key={i} className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-sm hover:shadow-xl transition-all group">
                    <div className="bg-purple-600/5 p-4 rounded-2xl w-fit group-hover:bg-purple-600 group-hover:text-white transition-colors mb-6">
                        <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">{f.desc}</p>
                </div>
            ))}
        </section>

        {/* CTA */}
        <section className="bg-black text-white p-12 sm:p-20 rounded-[3rem] text-center space-y-8 relative overflow-hidden shadow-2xl border-b-8 border-purple-600">
            <div className="relative z-10 space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Streamline Your Service Hub</h2>
                <p className="text-gray-400 font-medium text-sm max-w-2xl mx-auto opacity-80">Localized service management tools for Nairobi business owners.</p>
                <div className="pt-6">
                    <Button className="h-16 px-12 bg-purple-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-purple-700 transition-all border-none">Initialize My Service Node</Button>
                </div>
            </div>
        </section>
      </div>
    </MarketingWrapper>
  );
}