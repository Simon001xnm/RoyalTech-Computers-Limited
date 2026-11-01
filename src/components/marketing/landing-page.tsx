'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Zap, 
    CheckCircle2, 
    Star, 
    Package, 
    Utensils, 
    Smartphone,
    Activity,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Scissors,
    Wine
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import placeholderImages from '@/app/lib/placeholder-images.json';

/**
 * @fileOverview Premium Floating Landing Page
 * Implements a glassmorphic design where content panels float over a persistent background.
 */
export function LandingPage() {
  const animations = {
    fadeIn: { 
        initial: { opacity: 0, y: 30 }, 
        whileInView: { opacity: 1, y: 0 }, 
        viewport: { once: true, margin: "-100px" }, 
        transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  const floatingGlass = "bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-[2.5rem]";

  const testimonials = [
    { name: "Mary Wanjiku", loc: "Nairobi, KE", text: "Great service, great product. Simon is the man! If you need a system reach out to them. You will be glad you did." },
    { name: "Loice Wambui", loc: "Nakuru, KE", text: "One of the best customer services. Simon and his team are amazing, patient, and available at all hours. 7 days a week." },
    { name: "Michael Otieno", loc: "Mombasa, KE", text: "Been with them for years. Reliable for our bar system and always willing to troubleshoot even late at night." },
    { name: "Samuel Kamau", loc: "Nairobi, KE", text: "Simon (the owner) will call and take care of issues even on weekends. Top tier support that actually understands our business." }
  ];

  return (
    <div className="space-y-12 sm:space-y-24">
      
      {/* HERO SECTION */}
      <section className="relative px-6 pt-10 sm:pt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
                className="space-y-8 text-center lg:text-left z-10"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
            >
                <div className="inline-flex items-center gap-2 bg-[#eab308]/10 text-black dark:text-white px-4 py-2 rounded-full border border-[#eab308]/20 backdrop-blur-md mx-auto lg:mx-0">
                    <Sparkles className="h-4 w-4 text-[#eab308] fill-[#eab308]" />
                    <span className="text-[11px] font-bold tracking-widest">Premium Business Infrastructure</span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                    Business Stability <br /> 
                    <span className="text-[#eab308]">Engineered.</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-xl leading-relaxed mx-auto lg:mx-0">
                    Stop losing money to stock shrinkage and manual errors. Shop Manager is a carefully engineered experience that feels like a movie and a premium app while providing the stability your retail or business requires.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                    <Button asChild className="h-14 px-10 font-bold text-base bg-black text-white dark:bg-white dark:text-black hover:scale-105 rounded-2xl shadow-2xl transition-all">
                        <Link href="/signup">Start Free Trial</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 px-10 font-bold text-base border-2 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/40 transition-all">
                        <Link href="/support/contact">Book a Demo</Link>
                    </Button>
                </div>
            </motion.div>
            
            <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: "backOut" }}
            >
                <div className="absolute -inset-10 bg-[#eab308]/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
                <Card className={cn(floatingGlass, "p-3 relative z-10 overflow-hidden ring-1 ring-white/20 group")}>
                    <img 
                      src={placeholderImages.branding.hero_pos.url} 
                      alt="POS Hardware" 
                      className="rounded-[1.8rem] w-full h-auto object-cover aspect-[4/3] transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white">
                        <p className="text-sm font-bold">Local Support active in Nairobi, Kenya</p>
                    </div>
                </Card>
            </motion.div>
        </div>
      </section>

      {/* INDUSTRIES GRID */}
      <section id="industries" className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <motion.div className="text-center space-y-4" {...animations.fadeIn}>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Industries We Serve</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto">Different businesses need different POS workflows. We tailor the experience to your specific business model.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Restaurants & Bars', desc: 'Kitchen printers, tips, table management, and tabs.', icon: Utensils, color: 'bg-orange-500' },
                    { title: 'Retail Stores', desc: 'Barcode scanning, inventory, and category management.', icon: Package, color: 'bg-blue-600' },
                    { title: 'Salons & Spas', desc: 'Service menus, staff tracking, and client history.', icon: Scissors, color: 'bg-purple-600' },
                    { title: 'Liquor & Retail', desc: 'Fast scanning, cash controls, and strict permissions.', icon: Wine, color: 'bg-red-600' }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        className={cn(floatingGlass, "p-8 space-y-6 hover:translate-y-[-10px] transition-all group")}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div className={cn("p-4 rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform text-white", item.color)}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* STRATEGIC REVIEW SECTION */}
      <section className="px-6 py-12">
        <motion.div 
            className={cn(floatingGlass, "max-w-7xl mx-auto overflow-hidden")}
            {...animations.fadeIn}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
                <div className="p-10 sm:p-20 space-y-8">
                    <Badge className="bg-[#eab308] text-black font-bold text-[10px] px-4 h-7 tracking-widest">STRATEGIC CONSULTATION</Badge>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">Review before making a change.</h2>
                    <p className="text-base text-muted-foreground font-medium leading-relaxed">
                        Sometimes the better first step is reviewing your current setup. We analyze your merchant statements, inventory tools, and cash processes to identify leaks before you spend a shilling on new hardware.
                    </p>
                    <Button variant="outline" className="h-12 border-2 font-bold rounded-xl gap-2">
                        Get Free Statement Review <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="relative min-h-[300px] lg:min-h-full">
                    <img 
                      src={placeholderImages.branding.review_section.url} 
                      alt="Business Review" 
                      className="absolute inset-0 w-full h-full object-cover grayscale opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-transparent to-transparent dark:from-black/70" />
                </div>
            </div>
        </motion.div>
      </section>

      {/* PROBLEM SOLVER MATRIX */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div className="space-y-4" {...animations.fadeIn}>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Common Problems We Solve</h2>
                    <p className="text-muted-foreground font-medium max-w-xl">Turning operational headaches into streamlined workflows.</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    'Slow Checkout Process', 'Inventory Shrinkage', 'Confusing Financial Reports',
                    'High Processing Fees', 'Poor Local Support', 'Staff Training Issues',
                    'Cash Drawer Shortages', 'Untracked Voids & Refunds', 'Outdated Terminal Hardware'
                ].map((problem, i) => (
                    <motion.div 
                        key={i}
                        className={cn(floatingGlass, "p-5 flex items-center gap-4 group cursor-default")}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <div className="bg-[#eab308]/20 p-2 rounded-lg group-hover:bg-[#eab308] transition-colors">
                            <CheckCircle2 className="h-4 w-4 text-[#eab308] group-hover:text-black" />
                        </div>
                        <span className="text-[13px] font-bold tracking-tight">{problem}</span>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <motion.div className="text-center space-y-4" {...animations.fadeIn}>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Trusted by Nairobi Operators</h2>
                <p className="text-sm text-muted-foreground font-bold tracking-widest uppercase opacity-40">Real Feedback from the Field</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {testimonials.map((t, i) => (
                    <motion.div 
                        key={i} 
                        className={cn(floatingGlass, "p-8 space-y-6 hover:shadow-2xl transition-all relative overflow-hidden group")}
                        whileHover={{ y: -10 }}
                    >
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-[#eab308] text-[#eab308]" />)}
                        </div>
                        <p className="text-sm font-medium leading-relaxed italic text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
                        <div className="pt-4 border-t border-black/5 dark:border-white/5">
                            <p className="text-sm font-bold">{t.name}</p>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t.loc}</p>
                        </div>
                        <QuoteIcon className="absolute -bottom-4 -right-4 h-24 w-24 opacity-[0.03] group-hover:opacity-10 transition-opacity" />
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-24">
        <motion.div 
            className={cn(floatingGlass, "max-w-7xl mx-auto p-12 sm:p-24 text-center space-y-12 overflow-hidden border-b-8 border-b-[#eab308]")}
            {...animations.fadeIn}
        >
             <div className="space-y-6">
                <h2 className="text-4xl sm:text-7xl font-bold tracking-tight leading-tight">
                    Ready to <span className="text-[#eab308]">Optimize?</span>
                </h2>
                <p className="text-muted-foreground font-medium text-lg sm:text-xl max-w-2xl mx-auto">
                    Take the first step toward a more stable, error-free business.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button asChild size="lg" className="h-20 px-12 font-bold tracking-widest text-sm shadow-2xl bg-[#eab308] text-black hover:bg-[#d9a307] rounded-3xl active:scale-95 transition-all">
                    <Link href="/signup">Start Free Trial</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-20 px-12 font-bold tracking-widest text-sm border-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-3xl transition-all">
                    <Link href="/support/contact">Talk to an Expert</Link>
                </Button>
            </div>
        </motion.div>
      </section>

    </div>
  );
}

function QuoteIcon(props: any) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H11.017C10.4647 12 10.017 11.5523 10.017 11V9C10.017 6.79086 11.8079 5 14.017 5H15.017C15.5693 5 16.017 4.55228 16.017 4V3C16.017 2.44772 15.5693 2 15.017 2H14.017C10.151 2 7.017 5.13401 7.017 9V15C7.017 18.3137 9.70329 21 13.017 21H14.017ZM6.017 21L6.017 18C6.017 16.8954 6.91241 16 8.017 16H11.017C11.5693 16 12.017 15.5523 12.017 15V9C12.017 8.44772 11.5693 8 11.017 8H7.017C6.46472 8 6.017 8.44772 6.017 9V11C6.017 11.5523 5.56928 12 5.017 12H3.017C2.46472 12 2.017 11.5523 2.017 11V9C2.017 6.79086 3.80787 5 6.017 5H7.017C7.56928 5 8.017 4.55228 8.017 4V3C8.017 2.44772 7.56928 2 7.017 2H6.017C2.151 2 -0.983 5.13401 -0.983 9V15C-0.983 18.3137 1.70329 21 5.017 21H6.017Z" />
        </svg>
    )
}
