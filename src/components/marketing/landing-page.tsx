'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

  const floatingGlass = "bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.25)] rounded-[2.5rem]";

  const testimonials = [
    { name: "Mary Wanjiku", loc: "Nairobi, Kenya", text: "Great service, great product. Simon is the man! If you need a reliable business system in Nairobi, reach out to them. You will be glad you did." },
    { name: "Loice Wambui", loc: "Nakuru, Kenya", text: "The best customer service in the industry. Simon and his team are amazing, patient, and available at all hours. Perfect for our retail shop." },
    { name: "Michael Otieno", loc: "Mombasa, Kenya", text: "Been using Shop Manager for years. Reliable for our bar system and the local Mombasa support team is always willing to troubleshoot." },
    { name: "Samuel Kamau", loc: "Nairobi, Kenya", text: "Simon (the owner) will call and take care of issues even on weekends. Top tier support that actually understands the Kenyan business environment." }
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
                <div className="inline-flex items-center gap-2 bg-[#eab308] text-black px-4 py-2 rounded-full shadow-2xl mx-auto lg:mx-0 ring-4 ring-[#eab308]/20">
                    <Sparkles className="h-4 w-4 fill-black" />
                    <span className="text-[11px] font-bold tracking-widest uppercase">The #1 Business System in Kenya</span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-shadow-md">
                    Business Management <br /> 
                    <span className="text-[#eab308]">Simplified for Kenya.</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-xl leading-relaxed mx-auto lg:mx-0 opacity-90 drop-shadow-sm">
                    Stop losing money to stock shrinkage and manual errors. Shop Manager is the premium management system engineered for retailers in Nairobi and beyond, featuring seamless M-Pesa integration and high-speed hardware scanning.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                    <Button asChild className="h-14 px-10 font-bold text-base bg-[#eab308] text-black hover:bg-[#d9a307] hover:scale-105 rounded-2xl shadow-[0_15px_30px_rgba(234,179,8,0.3)] transition-all border-none">
                        <Link href="/signup">Start Free Trial</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 px-10 font-bold text-base border-2 border-black/10 bg-white/90 backdrop-blur-md rounded-2xl hover:bg-white hover:scale-105 transition-all shadow-lg">
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
                <div className="absolute -inset-10 bg-[#eab308]/40 rounded-full blur-[120px] opacity-70 animate-pulse" />
                <Card className={cn(floatingGlass, "p-4 relative z-10 overflow-hidden ring-2 ring-white/30 group shadow-[0_50px_100px_rgba(0,0,0,0.4)]")}>
                    <img 
                      src={placeholderImages.branding.hero_pos.url} 
                      alt="Modern Business Hardware in Kenya" 
                      className="rounded-[2rem] w-full h-auto object-cover aspect-[4/3] transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/85 backdrop-blur-2xl rounded-2xl border border-white/20 text-white shadow-2xl">
                        <p className="text-sm font-bold opacity-100 tracking-tight">Local Support Systems Active in Nairobi and Mombasa</p>
                    </div>
                </Card>
            </motion.div>
        </div>
      </section>

      {/* INDUSTRIES GRID */}
      <section id="industries" className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <motion.div className="text-center space-y-4" {...animations.fadeIn}>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-shadow-sm">Best Solutions for Every Kenyan Business</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-90">From boutiques in Westlands to restaurants in Mombasa, we tailor the management experience to your specific business model.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { title: 'Restaurants & Bars', desc: 'Kitchen displays, tips management, table tracking, and M-Pesa checkout.', icon: Utensils, color: 'bg-orange-500' },
                    { title: 'Retail & Hardware', desc: 'Barcode scanning, bulk inventory imports, and category management.', icon: Package, color: 'bg-blue-600' },
                    { title: 'Salons & Spas', desc: 'Service menus, staff commission tracking, and customer visit history.', icon: Scissors, color: 'bg-purple-600' },
                    { title: 'Liquor Stores', desc: 'Fast inventory counts, cash controls, and strict employee permissions.', icon: Wine, color: 'bg-red-600' }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        className={cn(floatingGlass, "p-8 space-y-6 hover:translate-y-[-10px] transition-all group shadow-[0_20px_40px_rgba(0,0,0,0.15)]")}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div className={cn("p-4 rounded-2xl w-fit shadow-xl group-hover:scale-110 transition-transform text-white", item.color)}>
                            <item.icon className="h-6 w-6 drop-shadow-md" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium opacity-90">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* STRATEGIC REVIEW SECTION */}
      <section className="px-6 py-12">
        <motion.div 
            className={cn(floatingGlass, "max-w-7xl mx-auto overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.2)]")}
            {...animations.fadeIn}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
                <div className="p-10 sm:p-20 space-y-8">
                    <Badge className="bg-[#eab308] text-black font-bold text-[10px] px-4 h-7 tracking-widest uppercase shadow-md">Nairobi Business Audit</Badge>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-shadow-sm">Identify leaks before making a change.</h2>
                    <p className="text-base text-muted-foreground font-medium leading-relaxed opacity-90">
                        Many Kenyan businesses lose up to 15% of revenue to untracked inventory. We analyze your current processes and merchant statements to identify gaps before you upgrade your system.
                    </p>
                    <Button variant="outline" className="h-12 border-2 border-[#eab308] text-black font-bold rounded-xl gap-2 bg-[#eab308]/10 hover:bg-[#eab308] transition-all shadow-lg">
                        Get a Free Business Review <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="relative min-h-[300px] lg:min-h-full shadow-inner">
                    <img 
                      src={placeholderImages.branding.review_section.url} 
                      alt="Business Analytics for Kenyan Companies" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-transparent to-transparent dark:from-black/95" />
                </div>
            </div>
        </motion.div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <motion.div className="text-center space-y-4" {...animations.fadeIn}>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-shadow-sm">Trusted by Nairobi and Mombasa Business Owners</h2>
                <p className="text-sm text-muted-foreground font-bold tracking-widest uppercase opacity-70">Verified Success Stories</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {testimonials.map((t, i) => (
                    <motion.div 
                        key={i} 
                        className={cn(floatingGlass, "p-8 space-y-6 hover:shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden group shadow-[0_15px_30px_rgba(0,0,0,0.1)]")}
                        whileHover={{ y: -10 }}
                    >
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-[#eab308] text-[#eab308]" />)}
                        </div>
                        <p className="text-sm font-medium leading-relaxed italic text-muted-foreground opacity-100">&ldquo;{t.text}&rdquo;</p>
                        <div className="pt-4 border-t border-black/10 dark:border-white/10">
                            <p className="text-sm font-bold">{t.name}</p>
                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{t.loc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-24">
        <motion.div 
            className={cn(floatingGlass, "max-w-7xl mx-auto p-12 sm:p-24 text-center space-y-12 overflow-hidden border-b-8 border-b-[#eab308] shadow-[0_60px_120px_rgba(0,0,0,0.4)]")}
            {...animations.fadeIn}
        >
             <div className="space-y-6">
                <h2 className="text-4xl sm:text-7xl font-bold tracking-tight leading-tight text-shadow-md">
                    Ready to <span className="text-[#eab308]">Optimize Your Shop?</span>
                </h2>
                <p className="text-muted-foreground font-medium text-lg sm:text-xl max-w-2xl mx-auto opacity-90 drop-shadow-sm">
                    Take the first step toward a more stable, error-free Kenyan business today.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button asChild size="lg" className="h-20 px-12 font-bold tracking-widest text-sm shadow-[0_20px_40px_rgba(234,179,8,0.4)] bg-[#eab308] text-black hover:bg-[#d9a307] rounded-3xl hover:scale-105 transition-all border-none">
                    <Link href="/signup">Setup My Shop</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-20 px-12 font-bold tracking-widest text-sm border-2 border-black/20 bg-white/90 backdrop-blur-md hover:bg-white hover:scale-105 rounded-3xl transition-all shadow-xl">
                    <Link href="/support/contact">Talk to an Expert</Link>
                </Button>
            </div>
        </motion.div>
      </section>

    </div>
  );
}
