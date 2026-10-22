'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
    Zap, 
    ArrowRight, 
    ShieldCheck, 
    CheckCircle2, 
    TrendingUp,
    Star,
    Building2,
    Activity,
    ShoppingCart,
    DollarSign,
    Receipt,
    Scale,
    CreditCard,
    Package,
    Wallet,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LandingPage() {
  const [activeFeature, setActiveFeature] = useState('Accounting');

  const features = [
    { name: 'Accounting', icon: DollarSign, description: 'Automatically update your books when you make a sale or record a purchase, generate financial reports, automate bank reconciliation, access audit trails, create E-invoices & E-way Bills, generate GSTR-1 & GSTR-2B Reports, and automate GSTR-2B reconciliation.' },
    { name: 'Invoicing', icon: Receipt, description: 'Create professional, high-fidelity A4 and thermal invoices. Track paid, partial, and credit status in real-time with automatic inventory deduction.' },
    { name: 'Compliance', icon: Scale, description: 'Stay audit-ready with permanent records and tax-compliant reporting. Handle VAT and local regulations with zero effort.' },
    { name: 'Payments', icon: CreditCard, description: 'Integrated M-Pesa STK Push, bank settlements, and cash tracking. Monitor every cent across multiple payment modes.' },
    { name: 'Inventory', icon: Package, description: 'Toggle between serialized tracking for high-value units and bulk stock management. Dynamic categories and sub-categories.' },
    { name: 'Expenses', icon: Wallet, description: 'Record every shop spend instantly. Categorize expenditures to see where your money goes and optimize your margins.' },
    { name: 'Sales', icon: ShoppingCart, description: 'High-speed POS interface designed for efficiency. Sell from your phone, tablet, or PC with instant cloud sync.' },
    { name: 'Vendors', icon: Users, description: 'Manage supplier relationships, track LPOs, and monitor purchase orders to keep your supply chain running smoothly.' }
  ];

  const currentFeature = features.find(f => f.name === activeFeature) || features[0];

  return (
    <div className="space-y-0">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000">
                <div className="inline-flex items-center gap-2 bg-[#eab308]/10 text-[#eab308] px-4 py-1.5 rounded-full border border-[#eab308]/20 shadow-sm">
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-[#eab308] text-[#eab308]" />)}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Rated 4.8/5 by businesses worldwide</span>
                </div>
                <h1 className="text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] transition-colors">
                    Smarter Way to <br />
                    <span className="text-[#eab308]">Manage Your Business.</span>
                </h1>
                <p className="text-xl text-muted-foreground font-bold uppercase tracking-tight max-w-lg leading-tight">
                    Everything You Need To Grow Your Business
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                    <Button asChild size="lg" className="h-16 px-12 font-black uppercase tracking-widest shadow-2xl bg-[#22c55e] text-white hover:bg-[#16a34a] rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Try for Free</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 px-12 font-black uppercase tracking-widest border-2 rounded-2xl group active:scale-95 transition-all bg-transparent border-muted-foreground/20">
                        <Link href="/company/about" className="flex items-center">
                            Explore Accounting <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
            </div>
            
            <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-300">
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#eab308]/20 to-transparent rounded-full blur-3xl opacity-30" />
                <div className="relative p-2 rounded-[40px] shadow-2xl ring-1 ring-[#eab308]/10 overflow-hidden bg-muted/20">
                    <img 
                        src="/ChatGPT Image Aug 7, 2026, 10_09_14 PM.png" 
                        alt="Shop Dashboard" 
                        className="rounded-[32px] w-full h-auto shadow-inner border border-[#eab308]/10" 
                    />
                </div>
            </div>
        </div>
      </section>

      {/* DYNAMIC FEATURE SHOWCASE */}
      <section className="py-24 bg-muted/10 border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center space-y-4">
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">Powerful Capabilities</h2>
                <p className="text-muted-foreground font-medium">Click a category to see how we help your shop succeed.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">
                <div className="flex flex-wrap lg:flex-col gap-2">
                    {features.map((f) => (
                        <button
                            key={f.name}
                            onClick={() => setActiveFeature(f.name)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all text-left",
                                activeFeature === f.name 
                                    ? "bg-[#eab308] text-black shadow-lg scale-105 z-10" 
                                    : "bg-white border hover:bg-muted/50 text-muted-foreground"
                            )}
                        >
                            <f.icon className="h-4 w-4" />
                            {f.name}
                        </button>
                    ))}
                </div>

                <Card className="p-12 bg-white border-none shadow-2xl rounded-[40px] flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-6">
                        <div className="bg-[#eab308]/10 p-4 rounded-2xl w-fit">
                            <currentFeature.icon className="h-8 w-8 text-[#eab308]" />
                        </div>
                        <h3 className="text-4xl font-black uppercase tracking-tighter">{currentFeature.name}</h3>
                        <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                            {currentFeature.description}
                        </p>
                        <div className="pt-6">
                            <Button asChild className="h-12 px-8 font-black uppercase tracking-widest rounded-xl">
                                <Link href="/signup">Get Started with {currentFeature.name}</Link>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </section>

      {/* WHY USE US */}
      <section className="py-24 relative" id="products">
        <div className="max-w-7xl mx-auto px-6 space-y-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 text-[#eab308] font-black uppercase text-[10px] tracking-widest">
                        <div className="h-1 w-6 bg-[#eab308] rounded-full" /> Growth Engineered
                    </div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter leading-[0.9]">
                        Easy tools to make <br /> your shop successful.
                    </h2>
                </div>
                <p className="text-muted-foreground text-sm font-medium max-w-xs">
                    No more messy books. Everything is organized in one simple place.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-10 bg-muted/10 border-none shadow-sm ring-1 ring-muted-foreground/10 rounded-[40px] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl w-fit mb-8 group-hover:bg-[#eab308] transition-colors shadow-lg">
                        <Building2 className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Manage Your Shops</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">Whether you have one shop or five, you can see all your stock and sales from your phone anywhere.</p>
                </Card>
                <Card className="p-10 bg-muted/10 border-none shadow-sm ring-1 ring-muted-foreground/10 rounded-[40px] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl w-fit mb-8 group-hover:bg-[#eab308] transition-colors shadow-lg">
                        <DollarSign className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">See Your Money</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">Know how much you sold today, how much profit you made, and who hasn't paid you yet.</p>
                </Card>
                <Card className="p-10 bg-muted/10 border-none shadow-sm ring-1 ring-muted-foreground/10 rounded-[40px] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl w-fit mb-8 group-hover:bg-[#eab308] transition-colors shadow-lg">
                        <ShieldCheck className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Your Data Is Safe</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">We keep your records protected with the best security. Only you can see your business secrets.</p>
                </Card>
            </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-24" id="pricing">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 text-[#eab308] font-black uppercase text-[10px] tracking-widest mx-auto">
                    <div className="h-1 w-6 bg-[#eab308] rounded-full" /> Honest Pricing
                </div>
                <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">Simple Plans</h2>
                <p className="text-muted-foreground text-sm font-medium">No hidden fees. Just clear plans for your business.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="p-12 rounded-[50px] bg-[#eab308] text-black space-y-8 relative overflow-hidden shadow-2xl group border-4 border-black">
                    <div className="space-y-4 relative z-10">
                        <Badge className="bg-black text-[#eab308] font-black text-[10px] uppercase h-6 px-3 border-none">FOR SMALL SHOPS</Badge>
                        <p className="text-sm font-bold opacity-80 max-w-[200px]">Perfect if you are just starting out.</p>
                    </div>
                    <div className="flex items-baseline relative z-10">
                        <span className="text-5xl font-black tracking-tighter">KES 2,500</span>
                        <span className="text-sm font-bold ml-1 opacity-60">/ Month</span>
                    </div>
                    <Button asChild size="lg" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl bg-black text-white hover:bg-black/90 border-none shadow-xl">
                        <Link href="/signup">Choose This Plan</Link>
                    </Button>
                    <ul className="space-y-4 pt-4 relative z-10">
                        {['Record Daily Sales', 'Track Shop Stock', 'Print Receipts', 'List Your Customers', 'See Monthly Profits'].map(item => (
                            <li key={item} className="flex items-center gap-3 text-xs font-bold uppercase">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-12 rounded-[50px] bg-[#1a1a1a] text-white space-y-8 relative overflow-hidden shadow-2xl group border-4 border-white/5">
                    <div className="space-y-4 relative z-10">
                        <Badge variant="outline" className="text-white border-[#eab308]/20 font-black text-[10px] uppercase h-6 px-3">FOR BIG BRANCHES</Badge>
                        <p className="text-sm font-bold opacity-60 max-w-[200px]">Made for shops with many locations.</p>
                    </div>
                    <div className="flex items-baseline relative z-10">
                        <span className="text-5xl font-black text-[#eab308] tracking-tighter">KES 7,500</span>
                        <span className="text-sm font-bold ml-1 opacity-40">/ Month</span>
                    </div>
                    <Button asChild size="lg" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl bg-[#eab308] text-black hover:bg-[#eab308]/90 border-none shadow-xl">
                        <Link href="/signup">Choose This Plan</Link>
                    </Button>
                    <ul className="space-y-4 pt-4 relative z-10">
                        {['Connect all branches', 'Unlimited staff members', 'Advanced shop reports', 'Add your own logo', '24/7 Support help'].map(item => (
                            <li key={item} className="flex items-center gap-3 text-xs font-bold uppercase">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22c55e]" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto p-12 lg:p-24 bg-[#1a1a1a] rounded-[60px] text-center space-y-12 relative overflow-hidden shadow-2xl border-b-8 border-b-[#eab308]">
             <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#eab308] text-black px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">
                    Are you ready?
                </div>
                <h2 className="text-6xl lg:text-8xl font-black uppercase tracking-tighter text-white leading-[0.85]">
                    Run your shop <br /> <span className="text-[#eab308]">the smart way.</span>
                </h2>
                <p className="text-white/60 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                    Join thousands of shop owners who are saving time and making more money with our easy tool.
                </p>
                <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="h-16 px-12 font-black uppercase tracking-widest shadow-2xl bg-[#22c55e] text-white hover:bg-[#16a34a] rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Create My Shop Now</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 px-12 font-black uppercase tracking-widest border-2 border-white/20 text-white hover:bg-white/5 rounded-2xl active:scale-95 transition-all">
                        <Link href="/support/contact">Ask a Question</Link>
                    </Button>
                </div>
             </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
