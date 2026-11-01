'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Zap, 
    CheckCircle2, 
    Star, 
    Building2, 
    Package, 
    Utensils, 
    Beer, 
    Coffee, 
    Truck, 
    Clock, 
    Phone, 
    Mail, 
    FileSearch,
    ArrowRight,
    Sparkles,
    Activity,
    MousePointer2,
    Globe,
    Layers,
    MoveUpRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import placeholderImages from '@/app/lib/placeholder-images.json';

export function LandingPage() {
  const animations = {
    fadeIn: { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8 } },
    stagger: { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { staggerChildren: 0.1 } }
  };

  const testimonials = [
    { name: "Mary Wanjiku", loc: "Nairobi, KE", text: "Great service, great Product. Simon is the man! If you need a system reach out to them. You will be glad you did." },
    { name: "Loice Wambui", loc: "Nakuru, KE", text: "One of the best customer services. Simon and his team are amazing, patient, and available at all hours. 7 days a week." },
    { name: "Michael Otieno", loc: "Mombasa, KE", text: "Been with them for years. Reliable for our bar system and always willing to troubleshoot even late at night." },
    { name: "Samuel Kamau", loc: "Nairobi, KE", text: "Simon (the owner) will call and take care of issues even on weekends. Top tier support that actually understands our business." }
  ];

  return (
    <div className="space-y-0 overflow-x-hidden selection:bg-[#eab308] selection:text-black">
      
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
                className="space-y-8 text-center lg:text-left"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
            >
                <div className="inline-flex items-center gap-2 bg-[#eab308]/10 text-[#eab308] px-4 py-2 rounded-full border border-[#eab308]/20 shadow-sm mx-auto lg:mx-0">
                    <Sparkles className="h-4 w-4 fill-[#eab308]" />
                    <span className="text-[11px] font-bold tracking-widest text-black">Advanced UI/UX Engineering</span>
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-black">
                    Engineered Business <br /> 
                    <span className="text-[#eab308]">Experiences.</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground font-medium max-w-xl leading-relaxed mx-auto lg:mx-0">
                    Software should feel like a premium app and an interactive presentation. We build tools that help Nairobi businesses run faster with zero friction.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                    <Button asChild className="h-16 px-12 font-bold text-base bg-black text-white hover:bg-black/90 rounded-2xl shadow-2xl active:scale-95 transition-all">
                        <Link href="/signup">Start Your Journey</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-16 px-12 font-bold text-base border-2 border-black/10 rounded-2xl bg-white hover:bg-muted/50 active:scale-95 transition-all">
                        <Link href="/support/contact">Book a Presentation</Link>
                    </Button>
                </div>
            </motion.div>
            
            <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.2 }}
            >
                <div className="absolute -inset-10 bg-gradient-to-tr from-[#eab308]/20 to-transparent rounded-full blur-3xl opacity-40 animate-pulse" />
                <Card className="relative border-none shadow-[0_50px_100px_rgba(0,0,0,0.15)] overflow-hidden rounded-[3rem] bg-muted/20 p-2 ring-1 ring-black/5 group">
                    <motion.img 
                      src={placeholderImages.branding.hero_pos.url} 
                      alt="Premium Experience" 
                      className="rounded-[2.5rem] w-full h-auto object-cover aspect-[4/3] transition-transform duration-700 group-hover:scale-105"
                      data-ai-hint="premium hardware"
                    />
                </Card>
            </motion.div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="py-24 bg-[#0a0a0a] text-white px-6">
        <div className="max-w-7xl mx-auto space-y-20">
            <motion.div 
                className="text-center space-y-4"
                {...animations.fadeIn}
            >
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">What makes us stunning?</h2>
                <p className="text-lg text-white/40 font-medium max-w-2xl mx-auto">Superior design meets advanced motion engineering.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { id: '01', title: 'Visual Design', desc: 'Refined typography, selected colors, and perfect visual hierarchy.', icon: Globe },
                    { id: '02', title: 'Motion Design', desc: 'Elements animate into view and transition between sections seamlessly.', icon: Zap },
                    { id: '03', title: 'Interactive', desc: 'Dynamic backgrounds, reactive cards, and cursor effects.', icon: MousePointer2 },
                    { id: '04', title: 'Premium UI/UX', desc: 'Intuitive interactions and frictionless user journeys.', icon: CheckCircle2 }
                ].map((item, i) => (
                    <motion.div 
                        key={item.id}
                        className="p-10 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6 hover:bg-white/10 transition-all group"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div className="bg-primary p-4 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                            <item.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">{item.id}. {item.title}</h3>
                            <p className="text-sm text-white/40 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div className="space-y-12" {...animations.fadeIn}>
                <div className="space-y-4">
                    <Badge className="bg-[#eab308] text-black font-bold text-[10px] px-4 h-7 tracking-widest">BUILT FOR PERFORMANCE</Badge>
                    <h2 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">Master the <br /><span className="text-[#eab308]">Stack.</span></h2>
                </div>
                <div className="space-y-6">
                    {[
                        { name: 'Next.js + React', desc: 'Building sophisticated, interactive dashboards.', color: 'bg-black' },
                        { name: 'Framer Motion', desc: 'Used for interactive interfaces and page transitions.', color: 'bg-primary' },
                        { name: 'Tailwind CSS', desc: 'Building polished, responsive layouts quickly.', color: 'bg-blue-600' }
                    ].map((tech, i) => (
                        <div key={i} className="flex gap-6 items-start group cursor-default">
                            <div className={cn("h-12 w-12 rounded-2xl shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-lg", tech.color)}>
                                {i + 1}
                            </div>
                            <div className="space-y-1 pt-1">
                                <h4 className="text-lg font-bold">{tech.name}</h4>
                                <p className="text-sm text-muted-foreground font-medium">{tech.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
            
            <motion.div 
                className="relative"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
            >
                <Card className="border-none shadow-[0_50px_100px_rgba(0,0,0,0.1)] overflow-hidden rounded-[3rem] bg-muted/20 p-2 ring-1 ring-black/5">
                    <img 
                      src={placeholderImages.branding.solutions_section.url} 
                      alt="Software Demo" 
                      className="rounded-[2.5rem] w-full h-auto object-cover aspect-video"
                      data-ai-hint="software demo"
                    />
                </Card>
                <div className="absolute -bottom-10 -left-10 bg-black text-white p-10 rounded-[2.5rem] shadow-2xl space-y-4 max-w-[280px] hidden md:block">
                    <p className="text-[10px] font-bold tracking-widest text-[#eab308]">EXPERT INSIGHT</p>
                    <p className="text-sm font-bold leading-relaxed italic">"The best systems don't have the most animations. They have the right ones at the right time."</p>
                </div>
            </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Trusted by operators</h2>
                <p className="text-sm text-muted-foreground font-semibold tracking-widest">REAL FEEDBACK FROM ACROSS KENYA</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {testimonials.map((t, i) => (
                    <motion.div 
                        key={i} 
                        className="p-8 bg-muted/5 rounded-[2.5rem] border border-black/5 space-y-6 hover:shadow-2xl transition-all"
                        whileHover={{ y: -10 }}
                    >
                        <div className="flex gap-1"><Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /> <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /> <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /> <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /> <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /></div>
                        <p className="text-sm font-medium leading-relaxed italic text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
                        <div className="pt-4 border-t border-black/5">
                            <p className="text-sm font-bold">{t.name}</p>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t.loc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto p-12 sm:p-24 bg-[#1a1a1a] rounded-[40px] sm:rounded-[5rem] text-center space-y-16 relative overflow-hidden shadow-2xl border-b-8 border-b-[#eab308]">
             <div className="relative z-10 space-y-12">
                <div className="space-y-6">
                    <h2 className="text-5xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
                        Ready to <br /> <span className="text-[#eab308]">Optimize?</span>
                    </h2>
                    <p className="text-white/40 font-medium text-lg sm:text-xl max-w-2xl mx-auto">Build the future of your business with engineered design.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                    <Button asChild size="lg" className="h-20 px-12 font-bold tracking-widest text-sm shadow-2xl bg-[#eab308] text-black hover:bg-[#eab308]/90 rounded-3xl active:scale-95 transition-all">
                        <Link href="/signup">Start Free Trial</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-20 px-12 font-bold tracking-widest text-sm border-2 border-white/20 text-white hover:bg-white/5 rounded-3xl active:scale-95 transition-all">
                        <Link href="/support/contact">Speak With an Expert</Link>
                    </Button>
                </div>
             </div>
        </div>
      </section>

      <footer className="py-20 text-center border-t border-black/5 bg-white">
          <p className="text-[10px] font-bold tracking-[0.5em] text-muted-foreground opacity-30 uppercase">
              Shop Manager &bull; Engineered Resilience &bull; v3.26
          </p>
      </footer>
    </div>
  );
}
