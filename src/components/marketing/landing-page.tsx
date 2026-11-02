
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
    Wine,
    Monitor,
    Calculator,
    Users,
    HardDrive,
    GraduationCap,
    Clock,
    Wrench,
    BookOpen,
    Rocket
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { PRICING } from '@/lib/constants';

export function LandingPage() {
  const animations = {
    fadeIn: { 
        initial: { opacity: 0, y: 30 }, 
        whileInView: { opacity: 1, y: 0 }, 
        viewport: { once: true, margin: "-100px" }, 
        transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  const floatingGlass = "bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-[2.5rem]";

  const installationSteps = [
    { title: 'System Audit', desc: 'We analyze your current shop workflows and hardware compatibility.', icon: Search },
    { title: 'Cloud Deployment', desc: 'Our engineering team initializes your secure business storage and node.', icon: HardDrive },
    { title: 'On-site Training', desc: 'We provide hands-on training for your staff on POS and inventory.', icon: BookOpen },
    { title: 'Live Handover', desc: 'Your shop goes live with 24/7 priority support active.', icon: Rocket }
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
                
                <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl max-w-xl mx-auto lg:mx-0 group hover:bg-white/15 transition-all">
                    <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed opacity-90 text-shadow-sm">
                        Stop losing money to stock shrinkage and manual errors. Shop Manager is the premium management system engineered for retailers in Nairobi and beyond, featuring seamless M-Pesa integration and high-speed hardware scanning.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                    <Button asChild className="h-14 px-10 font-bold text-base bg-[#eab308] text-black hover:bg-[#d9a307] hover:scale-105 rounded-2xl shadow-2xl transition-all border-none">
                        <Link href="/signup">Start Free Trial</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 px-10 font-bold text-base border-2 border-white/30 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 hover:scale-105 transition-all shadow-xl text-foreground">
                        <Link href="/support/contact">Request Demo</Link>
                    </Button>
                </div>
            </motion.div>
            
            <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: "backOut" }}
            >
                <div className="absolute -inset-10 bg-[#eab308]/30 rounded-full blur-[120px] opacity-50 animate-pulse" />
                <Card className={cn(floatingGlass, "p-4 relative z-10 overflow-hidden ring-2 ring-white/30 group shadow-2xl")}>
                    <img 
                      src={placeholderImages.branding.hero_pos.url} 
                      alt="Modern Business Hardware in Kenya" 
                      className="rounded-[2rem] w-full h-auto object-cover aspect-[4/3] transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/85 backdrop-blur-2xl rounded-2xl border border-white/20 text-white shadow-2xl">
                        <p className="text-sm font-bold opacity-100 tracking-tight text-shadow-sm">Local Support Active in Nairobi and Mombasa</p>
                    </div>
                </Card>
            </motion.div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <motion.div className="text-center space-y-4" {...animations.fadeIn}>
                <Badge variant="outline" className="font-bold uppercase text-[10px] tracking-widest px-4 h-7 border-primary/20 bg-white/50 text-primary">Simple Pricing</Badge>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-shadow-md">Invest in Your Growth</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-80">No complex monthly fees. A simple, transparent investment for a lifetime of stable operations.</p>
            </motion.div>

            <div className="flex justify-center">
                <motion.div 
                    className={cn(floatingGlass, "w-full max-w-lg p-10 sm:p-16 border-t-8 border-t-[#eab308] relative")}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="absolute -top-5 right-10 bg-[#eab308] text-black font-black text-[10px] px-6 py-2 rounded-full shadow-xl uppercase tracking-[0.2em]">
                        7-Day Free Trial Included
                    </div>
                    
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Enterprise Hub</h3>
                            <p className="text-sm text-muted-foreground font-medium opacity-80">Complete management suite for professional retailers.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-black tracking-tighter">KES {PRICING.ONE_TIME_SETUP.toLocaleString()}</span>
                                <span className="text-xs font-bold uppercase opacity-40 mb-2">/ One-time Setup</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black tracking-tighter">KES {PRICING.ANNUAL_SUBSCRIPTION.toLocaleString()}</span>
                                <span className="text-xs font-bold uppercase opacity-40 mb-1.5">/ Annual License</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6">
                            {[
                                'Real-time Inventory & Low Stock Alerts',
                                'Professional A4 & Thermal Receipts',
                                'M-Pesa STK Push Integration',
                                'KRA Compliant Financial Reports',
                                'Staff Role & Permission Management',
                                '24/7 Priority Engineer Support'
                            ].map(feature => (
                                <div key={feature} className="flex items-center gap-3">
                                    <div className="bg-green-500/10 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                                    <span className="text-[11px] font-bold uppercase tracking-tight opacity-70">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8">
                            <Button asChild className="w-full h-16 text-sm font-black uppercase tracking-widest bg-[#eab308] text-black hover:bg-[#d9a307] rounded-3xl shadow-2xl">
                                <Link href="/signup">Start Free Trial Now</Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
      </section>

      {/* INSTALLATION STEPS */}
      <section id="installation" className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <motion.div className="text-center space-y-4" {...animations.fadeIn}>
                <Badge className="bg-primary text-white font-bold text-[9px] px-4 h-7 tracking-widest uppercase">The Process</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-shadow-md">How We Install Your System</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-80">Our engineering team handles everything from deployment to staff training.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {installationSteps.map((step, i) => (
                    <motion.div 
                        key={i}
                        className={cn(floatingGlass, "p-8 space-y-6 relative overflow-hidden group")}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div className="absolute -right-4 -top-4 text-8xl font-black text-primary/5 select-none">{i + 1}</div>
                        <div className="bg-primary/5 p-4 rounded-2xl w-fit shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-2 relative z-10">
                            <h3 className="text-xl font-bold uppercase tracking-tight">{step.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium opacity-80">{step.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* INDUSTRIES GRID */}
      <section id="industries" className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
            <motion.div className="text-center space-y-4" {...animations.fadeIn}>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-shadow-md">Best Solutions for Every Kenyan Business</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-80 text-shadow-sm">From boutiques in Westlands to restaurants in Mombasa, we tailor the management experience to your specific business model.</p>
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
                        className={cn(floatingGlass, "p-8 space-y-6 hover:translate-y-[-10px] transition-all group shadow-2xl")}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div className={cn("p-4 rounded-2xl w-fit shadow-xl group-hover:scale-110 transition-transform text-white", item.color)}>
                            <item.icon className="h-6 w-6 drop-shadow-md" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold tracking-tight text-shadow-sm">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium opacity-80">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-24">
        <motion.div 
            className={cn(floatingGlass, "max-w-7xl mx-auto p-12 sm:p-24 text-center space-y-12 overflow-hidden border-b-8 border-b-[#eab308] shadow-2xl")}
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
                <Button asChild size="lg" className="h-20 px-12 font-bold tracking-widest text-sm shadow-2xl bg-[#eab308] text-black hover:bg-[#d9a307] rounded-3xl hover:scale-105 transition-all border-none">
                    <Link href="/signup">Setup My Shop</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-20 px-12 font-bold tracking-widest text-sm border-2 border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:scale-105 rounded-3xl transition-all shadow-2xl text-foreground">
                    <Link href="/support/contact">Talk to an Expert</Link>
                </Button>
            </div>
        </motion.div>
      </section>

    </div>
  );
}
