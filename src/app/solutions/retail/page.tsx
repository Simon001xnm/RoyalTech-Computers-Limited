'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Barcode, TrendingUp, CheckCircle2, ArrowRight, RefreshCcw, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { cn } from '@/lib/utils';

export default function RetailSolutionPage() {
  const floatingGlass = "bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.25)] rounded-[2.5rem]";

  const howItWorks = [
    { title: 'Barcode Capture', desc: 'Scan any item using standard USB or Wireless hardware. The system identifies the model and price instantly.', icon: Barcode },
    { title: 'Inventory Sync', desc: 'Every sale automatically deducts stock levels across all your shop nodes in real-time.', icon: RefreshCcw },
    { title: 'Ledger Entry', desc: 'The transaction is logged into your daily sales report and client debt profile simultaneously.', icon: DollarSign }
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
                <div className="inline-flex items-center gap-2 bg-[#eab308] text-black px-4 py-1.5 rounded-full shadow-xl ring-4 ring-[#eab308]/20">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Retail & Hardware System</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-none text-shadow-md">
                    Smart Inventory for <br />
                    <span className="text-[#eab308]">Kenyan Retailers.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed opacity-90 text-shadow">
                    Stop losing money to stock shrinkage. Our system provides real-time counts, barcode integration, and automated reorder alerts for shops in Nairobi and across Kenya.
                </p>
                <div className="flex gap-4">
                    <Button className="h-14 px-10 font-bold uppercase tracking-widest text-[11px] shadow-[0_15px_30px_rgba(234,179,8,0.3)] rounded-2xl bg-[#eab308] text-black hover:bg-[#d9a307] border-none">Get Started</Button>
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
                    <img src={placeholderImages.branding.hero_pos.url} alt="Retail POS" className="rounded-[2rem] w-full object-cover aspect-[4/3]" />
                </Card>
            </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-16">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="font-bold uppercase text-[9px] tracking-widest px-4 h-7 border-primary/20 bg-white/50 shadow-sm">The Process</Badge>
                <h2 className="text-3xl font-bold uppercase tracking-tight text-shadow-sm">How the Retail System Works</h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto opacity-90">A high-fidelity flow designed for speed and accuracy on the shop floor.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {howItWorks.map((step, i) => (
                    <div key={i} className={cn(floatingGlass, "p-8 relative group hover:-translate-y-2 transition-all")}>
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xl">{i + 1}</div>
                        <div className="bg-primary/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-500 shadow-inner">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-90">{step.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* FEATURES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
            {[
                { title: 'Barcode Scanning', desc: 'Add items to sales instantly using standard hardware scanners.', icon: Barcode },
                { title: 'Stock Auditing', desc: 'Real-time tracking of every unit from arrival to final sale.', icon: Package },
                { title: 'Sales Analytics', desc: 'Detailed reports on your best-moving products and margins.', icon: TrendingUp },
            ].map((f, i) => (
                <div key={i} className={cn(floatingGlass, "p-8 space-y-6 hover:shadow-2xl transition-all group")}>
                    <div className="bg-primary/5 p-4 rounded-2xl w-fit group-hover:bg-primary group-hover:text-white transition-colors mb-6 shadow-inner">
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
