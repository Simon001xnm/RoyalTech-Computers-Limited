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

export function LandingPage() {
  const animations = {
    fadeIn: { 
        initial: { opacity: 0, y: 30 }, 
        whileInView: { opacity: 1, y: 0 }, 
        viewport: { once: true, margin: "-100px" }, 
        transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  const floatingGlass = "bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-[2.5rem]";

  const testimonials = [
    { name: "Mary Wanjiku", loc: "Nairobi, Kenya", text: "Great service, great product. Simon is the man! If you need a reliable business system in Nairobi, reach out to them. You will be glad you did." },
    { name: "Loice Wambui", loc: "Nakuru, Kenya", text: "The best customer service in the industry. Simon and his team are amazing, patient, and available at all hours. Perfect for our retail shop." },
    { name: "Michael Otieno", loc: "Mombasa, Kenya", text: "Been using Shop Manager for years. Reliable for our bar system and the local Mombasa support team is always willing to troubleshoot." },
    { name: "Samuel Kamau", loc: "Nairobi, Kenya", text: "Simon (the owner) will call and take care of issues even on weekends. Top tier support that actually understands the Kenyan business environment." }
  ];

  return (
    <div className="space-y-12 sm:space-y-24">
      
      {/* HERO SECTION - SEO TARGETED */}
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
                    <span className="text-[11px] font-bold tracking-widest">The #1 POS System in Kenya</span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                    Business Management <br /> 
                    <span className="text-[#eab308]">Simplified for Kenya.</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-xl leading-relaxed mx-auto lg:mx-0">
                    Stop losing money to stock shrinkage and manual errors. Shop Manager is the premium business management system engineered for retailers in Nairobi and beyond, featuring seamless M-Pesa integration and high-speed hardware scanning.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                    <Button asChild className="h-14 px-10 font-bold text-base bg-black text-white dark:bg-white dark:text-black hover:scale-105 rounded-2xl shadow-2xl transition-all">
                        <Link href="/signup">Start Your Free Trial</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 px-10 font-bold text-base border-2 bg-white/40 backdrop-blur-md rounded-2xl hover:bg-white/60 transition-all">
                        <Link href="/support/contact">Book a Nairobi Demo</Link>
                    </Button>
                </div>
            </motion.div>
            
            <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: "backOut" }}
            >
                <div className="absolute -inset-10 bg-[#eab308]/20 rounded-full blur-[120px] opacity-60 animate-pulse" />
                <Card className={cn(floatingGlass, "p-3 relative z-10 overflow-hidden ring-1 ring-white/20 group")}>
                    <img 
                      src={placeholderImages.branding.hero_pos.url} 
                      alt="Modern POS Hardware in Kenya" 
                      className="rounded-[1.8rem] w-full h-auto object-cover aspect-[4/3] transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 text-white">
                        <p className="text-sm font-bold">Local Support Nodes Active in Nairobi and Mombasa</p>
                    </div>
                </Card>
            </motion.div>
        </div>
      </section>

      {/* INDUSTRIES GRID */}
      <section id="industries" className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <motion.div className="text-center space-y-4" {...animations.fadeIn}>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Best Solutions for Every Kenyan Business</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto">From boutiques in Westlands to restaurants in Mombasa, we tailor the management experience to your specific business model.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Restaurants & Bars', desc: 'Kitchen displays, tips management, table tracking, and M-Pesa checkout.', icon: Utensils, color: 'bg-orange-500' },
                    { title: 'Retail & Hardware', desc: 'Barcode scanning, bulk inventory imports, and category management.', icon: Package, color: 'bg-blue-600' },
                    { title: 'Salons & Spas', desc: 'Service menus, staff commission tracking, and customer visit history.', icon: Scissors, color: 'bg-purple-600' },
                    { title: 'Liquor Stores', desc: 'Fast inventory counts, cash controls, and strict employee permissions.', icon: Wine, color: 'bg-red-600' }
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

      {/* STRATEGIC REVIEW SECTION - VIBRANT COLOR */}
      <section className="px-6 py-12">
        <motion.div 
            className={cn(floatingGlass, "max-w-7xl mx-auto overflow-hidden")}
            {...animations.fadeIn}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
                <div className="p-10 sm:p-20 space-y-8">
                    <Badge className="bg-[#eab308] text-black font-bold text-[10px] px-4 h-7 tracking-widest">Nairobi Business Audit</Badge>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">Identify leaks before making a change.</h2>
                    <p className="text-base text-muted-foreground font-medium leading-relaxed">
                        Many Kenyan businesses lose up to 15% of revenue to untracked inventory. We analyze your current processes and merchant statements to identify gaps before you upgrade your system.
                    </p>
                    <Button variant="outline" className="h-12 border-2 font-bold rounded-xl gap-2 bg-white/50 backdrop-blur-sm">
                        Get a Free Business Review <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="relative min-h-[300px] lg:min-h-full">
                    <img 
                      src={placeholderImages.branding.review_section.url} 
                      alt="Business Analytics for Kenyan Companies" 
                      className="absolute inset-0 w-full h-full object-cover opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-transparent dark:from-black/80" />
                </div>
            </div>
        </motion.div>
      </section>

      {/* PROBLEM SOLVER MATRIX */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div className="space-y-4" {...animations.fadeIn}>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Common Challenges for Shops in Kenya</h2>
                    <p className="text-muted-foreground font-medium max-w-xl">Turning complex retail operations into simple, profitable workflows.</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    'Slow M-Pesa Reconciliation', 'Stock Discrepancies', 'Vague Profit Reports',
                    'High Subscription Costs', 'Poor Local Technical Support', 'Staff Training Difficulty',
                    'Cash Drawer Shortages', 'Untracked Customer Voids', 'KRA Compliance Issues'
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
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Trusted by Nairobi and Mombasa Business Owners</h2>
                <p className="text-sm text-muted-foreground font-bold tracking-widest uppercase opacity-60">Verified Success Stories</p>
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
                        <div className="pt-4 border-t border-black/10 dark:border-white/10">
                            <p className="text-sm font-bold">{t.name}</p>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t.loc}</p>
                        </div>
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
                    Ready to <span className="text-[#eab308]">Optimize Your Shop?</span>
                </h2>
                <p className="text-muted-foreground font-medium text-lg sm:text-xl max-w-2xl mx-auto">
                    Take the first step toward a more stable, error-free Kenyan business today.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button asChild size="lg" className="h-20 px-12 font-bold tracking-widest text-sm shadow-2xl bg-[#eab308] text-black hover:bg-[#d9a307] rounded-3xl active:scale-95 transition-all">
                    <Link href="/signup">Setup My Shop Node</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-20 px-12 font-bold tracking-widest text-sm border-2 bg-white/40 backdrop-blur-md hover:bg-white/60 rounded-3xl transition-all">
                    <Link href="/support/contact">Talk to a Kenya Expert</Link>
                </Button>
            </div>
        </motion.div>
      </section>

    </div>
  );
}
