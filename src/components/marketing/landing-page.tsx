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
    <div className="space-y-0 overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-20 lg:pb-32 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-[#eab308]/10 text-[#eab308] px-4 py-1.5 rounded-full border border-[#eab308]/20 shadow-sm mx-auto lg:mx-0">
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-[#eab308] text-[#eab308]" />)}
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Rated 4.8/5 by global brands</span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] sm:leading-[0.85] transition-colors">
                    Smarter Way to <br className="hidden sm:block" />
                    <span className="text-[#eab308]">Manage Your Business.</span>
                </h1>
                <p className="text-base sm:text-xl text-muted-foreground font-bold uppercase tracking-tight max-w-lg leading-tight mx-auto lg:mx-0">
                    Everything You Need To Grow Your Business
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4 px-4 sm:px-0">
                    <Button asChild size="lg" className="h-14 sm:h-16 px-8 sm:px-12 font-black uppercase tracking-widest shadow-2xl bg-[#22c55e] text-white hover:bg-[#16a34a] rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Try for Free</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 sm:h-16 px-8 sm:px-12 font-black uppercase tracking-widest border-2 rounded-2xl group active:scale-95 transition-all bg-transparent border-muted-foreground/20">
                        <Link href="/company/about" className="flex items-center">
                            Learn More <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
            </div>
            
            <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-300 px-4 sm:px-0">
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#eab308]/20 to-transparent rounded-full blur-3xl opacity-30" />
                <div className="relative p-1.5 sm:p-2 rounded-[30px] sm:rounded-[40px] shadow-2xl ring-1 ring-[#eab308]/10 overflow-hidden bg-muted/20">
                    <img 
                        src="/ChatGPT Image Aug 7, 2026, 10_09_14 PM.png" 
                        alt="Shop Dashboard" 
                        className="rounded-[24px] sm:rounded-[32px] w-full h-auto shadow-inner border border-[#eab308]/10" 
                    />
                </div>
            </div>
        </div>
      </section>

      {/* DYNAMIC FEATURE SHOWCASE */}
      <section className="py-16 sm:py-24 bg-muted/10 border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
            <div className="text-center space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Powerful Capabilities</h2>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">Select a category to explore our node intelligence.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 sm:gap-12">
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 no-scrollbar px-1 sm:px-0">
                    {features.map((f) => (
                        <button
                            key={f.name}
                            onClick={() => setActiveFeature(f.name)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[11px] tracking-widest transition-all text-left shrink-0 lg:shrink",
                                activeFeature === f.name 
                                    ? "bg-[#eab308] text-black shadow-lg scale-[1.02] sm:scale-105 z-10" 
                                    : "bg-white border hover:bg-muted/50 text-muted-foreground"
                            )}
                        >
                            <f.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {f.name}
                        </button>
                    ))}
                </div>

                <Card className="p-8 sm:p-12 bg-white border-none shadow-2xl rounded-[1.5rem] sm:rounded-[40px] flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500 min-h-[300px] sm:min-h-[400px]">
                    <div className="space-y-6">
                        <div className="bg-[#eab308]/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit">
                            <currentFeature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-[#eab308]" />
                        </div>
                        <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">{currentFeature.name}</h3>
                        <p className="text-base sm:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl">
                            {currentFeature.description}
                        </p>
                        <div className="pt-4">
                            <Button asChild className="h-11 sm:h-12 px-6 sm:px-8 font-black uppercase tracking-widest rounded-xl text-[10px] sm:text-xs">
                                <Link href="/signup">Get Started with {currentFeature.name}</Link>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </section>

      {/* WHY USE US */}
      <section className="py-16 sm:py-24 relative px-4 sm:px-0" id="products">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 text-[#eab308] font-black uppercase text-[10px] tracking-widest mx-auto md:mx-0">
                        <div className="h-1 w-6 bg-[#eab308] rounded-full" /> Growth Engineered
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-[0.95] sm:leading-[0.9]">
                        Easy tools to make <br className="hidden sm:block" /> your shop successful.
                    </h2>
                </div>
                <p className="text-muted-foreground text-sm font-medium max-w-xs mx-auto md:mx-0 text-center md:text-right">
                    No more messy books. Everything is organized in one simple, secure cloud node.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                <Card className="p-8 sm:p-10 bg-muted/10 border-none shadow-sm ring-1 ring-muted-foreground/10 rounded-[2rem] sm:rounded-[40px] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                    <div className="bg-[#1a1a1a] p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit mb-6 sm:mb-8 group-hover:bg-[#eab308] transition-colors shadow-lg">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter mb-3">Multi-Node Control</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">Whether you have one shop or five, manage all stock and sales from your phone anywhere with instant synchronization.</p>
                </Card>
                <Card className="p-8 sm:p-10 bg-muted/10 border-none shadow-sm ring-1 ring-muted-foreground/10 rounded-[2rem] sm:rounded-[40px] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                    <div className="bg-[#1a1a1a] p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit mb-6 sm:mb-8 group-hover:bg-[#eab308] transition-colors shadow-lg">
                        <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter mb-3">Capital Analytics</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">Know exactly how much you sold today, track your profit margins, and monitor pending receivables with precision.</p>
                </Card>
                <Card className="p-8 sm:p-10 bg-muted/10 border-none shadow-sm ring-1 ring-muted-foreground/10 rounded-[2rem] sm:rounded-[40px] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                    <div className="bg-[#1a1a1a] p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit mb-6 sm:mb-8 group-hover:bg-[#eab308] transition-colors shadow-lg">
                        <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter mb-3">Enterprise Privacy</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">We utilize industry-leading encryption and multi-tenant isolation. Your business intelligence remains exclusively yours.</p>
                </Card>
            </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-16 sm:py-24" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 text-[#eab308] font-black uppercase text-[10px] tracking-widest mx-auto">
                    <div className="h-1 w-6 bg-[#eab308] rounded-full" /> Transparent Billing
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tighter">Simple Plans</h2>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">Scalable subscriptions designed for every stage of growth.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
                <div className="p-10 sm:p-12 rounded-[35px] sm:rounded-[50px] bg-[#eab308] text-black space-y-6 sm:space-y-8 relative overflow-hidden shadow-2xl group border-4 border-black">
                    <div className="space-y-4 relative z-10">
                        <Badge className="bg-black text-[#eab308] font-black text-[10px] uppercase h-6 px-3 border-none">SOLO OPERATOR</Badge>
                        <p className="text-sm font-bold opacity-80 max-w-[220px]">Perfect for single retail units and small service shops.</p>
                    </div>
                    <div className="flex items-baseline relative z-10">
                        <span className="text-4xl sm:text-5xl font-black tracking-tighter">KES 2,500</span>
                        <span className="text-xs sm:text-sm font-bold ml-1 opacity-60">/ Month</span>
                    </div>
                    <Button asChild size="lg" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl bg-black text-white hover:bg-black/90 border-none shadow-xl transition-transform active:scale-95">
                        <Link href="/signup">Select Base Plan</Link>
                    </Button>
                    <ul className="space-y-4 pt-4 relative z-10">
                        {['Daily Sales Ledger', 'Inventory Tracking', 'Thermal Receipts', 'Customer Directory', 'Profit Analytics'].map(item => (
                            <li key={item} className="flex items-center gap-3 text-xs font-bold uppercase">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-10 sm:p-12 rounded-[35px] sm:rounded-[50px] bg-[#1a1a1a] text-white space-y-6 sm:space-y-8 relative overflow-hidden shadow-2xl group border-4 border-white/5">
                    <div className="space-y-4 relative z-10">
                        <Badge variant="outline" className="text-white border-[#eab308]/20 font-black text-[10px] uppercase h-6 px-3">ENTERPRISE CLUSTER</Badge>
                        <p className="text-sm font-bold opacity-60 max-w-[220px]">Designed for high-volume branches and multi-unit chains.</p>
                    </div>
                    <div className="flex items-baseline relative z-10">
                        <span className="text-4xl sm:text-5xl font-black text-[#eab308] tracking-tighter">KES 7,500</span>
                        <span className="text-xs sm:text-sm font-bold ml-1 opacity-40">/ Month</span>
                    </div>
                    <Button asChild size="lg" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl bg-[#eab308] text-black hover:bg-[#eab308]/90 border-none shadow-xl transition-transform active:scale-95">
                        <Link href="/signup">Select Pro Plan</Link>
                    </Button>
                    <ul className="space-y-4 pt-4 relative z-10">
                        {['Multi-Branch Sync', 'Unlimited Operators', 'Custom PDF Branding', 'Advanced Audit Logs', 'Priority Node Support'].map(item => (
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
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto p-10 sm:p-24 bg-[#1a1a1a] rounded-[40px] sm:rounded-[60px] text-center space-y-8 sm:space-y-12 relative overflow-hidden shadow-2xl border-b-8 border-b-[#eab308]">
             <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#eab308] text-black px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">
                    Deployment Ready
                </div>
                <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tighter text-white leading-[0.9] sm:leading-[0.85]">
                    Run your shop <br className="hidden sm:block" /> <span className="text-[#eab308]">the smart way.</span>
                </h2>
                <p className="text-white/60 font-medium text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                    Join thousands of business owners who are optimizing their data flow and accelerating growth with our node intelligence.
                </p>
                <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="h-14 sm:h-16 px-10 sm:px-12 font-black uppercase tracking-widest shadow-2xl bg-[#22c55e] text-white hover:bg-[#16a34a] rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Deploy Node Now</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 sm:h-16 px-10 sm:px-12 font-black uppercase tracking-widest border-2 border-white/20 text-white hover:bg-white/5 rounded-2xl active:scale-95 transition-all">
                        <Link href="/support/contact">Contact Advisory</Link>
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
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
