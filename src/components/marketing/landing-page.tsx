'use client';

import React from 'react';
import { MarketingWrapper } from './marketing-wrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Zap, 
    ArrowRight, 
    ShieldCheck, 
    Smartphone, 
    Users, 
    CheckCircle2, 
    PlayCircle,
    TrendingUp,
    Globe,
    Landmark,
    LayoutDashboard,
    Star,
    Building2
} from 'lucide-react';
import Link from 'next/link';

/**
 * @fileOverview Business Hub Landing Page
 * High-fidelity SaaS website based on the provided design reference.
 */
export function LandingPage() {
  return (
    <MarketingWrapper>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000">
                <div className="inline-flex items-center gap-2 bg-[#eab308]/10 text-[#eab308] px-4 py-1.5 rounded-full border border-[#eab308]/20 shadow-sm">
                    <Badge className="bg-[#eab308] text-black hover:bg-[#eab308] font-black text-[9px] h-5 px-2">NEW</Badge>
                    <span className="text-[10px] font-black uppercase tracking-widest">Start Your 14-Day Free Trial</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-black">
                    Your Business Hub, <br />
                    <span className="text-[#eab308]">Just A Click Away</span>
                </h1>
                <p className="text-base text-muted-foreground font-medium max-w-lg leading-relaxed">
                    Easily manage your shop with a powerful, intuitive dashboard that brings all your inventory, sales, and clients together in one secure cloud workspace.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                    <Button asChild size="lg" className="h-14 px-10 font-black uppercase tracking-widest shadow-2xl bg-black text-white hover:bg-black/90 rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Start Free Trial</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-10 font-black uppercase tracking-widest border-2 rounded-2xl group active:scale-95 transition-all">
                        <Link href="/company/about" className="flex items-center">
                            Learn More <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-4 pt-8">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-10 rounded-full border-2 border-white overflow-hidden shadow-md">
                                <img src={`https://picsum.photos/seed/user${i}/64/64`} alt="user" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-[#eab308] text-[#eab308]" />)}
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Trusted By 2k+ Customers</p>
                    </div>
                </div>
            </div>
            
            <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-300">
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#eab308]/20 to-transparent rounded-full blur-3xl opacity-50" />
                <div className="relative bg-white p-2 rounded-[40px] shadow-2xl ring-1 ring-black/5 overflow-hidden">
                    <img 
                        src="https://picsum.photos/seed/dashboard/1200/900" 
                        alt="Business Hub Dashboard" 
                        className="rounded-[32px] w-full h-auto shadow-inner border border-black/5" 
                    />
                    {/* Floating elements to mimic the UI in image */}
                    <div className="absolute top-10 left-10 p-4 bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-black/5 animate-bounce-slow">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 className="h-4 w-4" /></div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-muted-foreground">Sale Success</p>
                                <p className="text-xs font-black uppercase tracking-tight">Payment Verified</p>
                            </div>
                         </div>
                    </div>
                    <div className="absolute bottom-10 right-10 p-6 bg-black text-white rounded-3xl shadow-2xl w-56 animate-float">
                        <p className="text-[10px] font-bold uppercase opacity-60 mb-2">Total Balance</p>
                        <p className="text-2xl font-black tracking-tighter">KES 840,200.00</p>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest">Master Card</span>
                            <div className="flex gap-1">
                                <div className="h-2 w-2 rounded-full bg-white/20" />
                                <div className="h-2 w-2 rounded-full bg-white/40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* TRUSTED BY LOGOS */}
      <section className="py-12 bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-60">Trusted by over 100 businesses for their operations</p>
            <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-30 grayscale hover:opacity-100 transition-all duration-500">
                <span className="text-xl font-black italic tracking-tighter">CoreOS</span>
                <span className="text-xl font-black tracking-widest">Goodwell</span>
                <span className="text-xl font-black lowercase">EasyTax</span>
                <span className="text-xl font-black uppercase tracking-tight">Foresight</span>
                <span className="text-xl font-black tracking-tighter">Leapyear</span>
            </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 space-y-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 text-[#eab308] font-black uppercase text-[10px] tracking-widest">
                        <div className="h-1 w-6 bg-[#eab308] rounded-full" /> Platform Features
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-black">
                        An experience that evolves <br /> and scales with you.
                    </h2>
                </div>
                <p className="text-muted-foreground text-sm font-medium max-w-sm">
                    Our platform adapts to your shop's needs, providing a seamless experience that grows as your sales volume increases.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-10 bg-white border-none shadow-sm ring-1 ring-black/5 rounded-[40px] hover:shadow-xl hover:-translate-y-2 transition-all group">
                    <div className="bg-[#eab308]/10 p-4 rounded-2xl w-fit mb-8 group-hover:bg-[#eab308] group-hover:text-black transition-colors">
                        <Building2 className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-black mb-3">Multiple Accounts</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">Manage all your shop branches or entities effortlessly with multi-tenant account support.</p>
                    <Button variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest group-hover:gap-2 transition-all">Learn More <ArrowRight className="h-3 w-3" /></Button>
                </Card>
                <Card className="p-10 bg-white border-none shadow-sm ring-1 ring-black/5 rounded-[40px] hover:shadow-xl hover:-translate-y-2 transition-all group">
                    <div className="bg-[#eab308]/10 p-4 rounded-2xl w-fit mb-8 group-hover:bg-[#eab308] group-hover:text-black transition-colors">
                        <TrendingUp className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-black mb-3">Live Analysis</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">Track your revenue flow, top selling products, and customer trends in real-time with smart reporting.</p>
                    <Button variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest group-hover:gap-2 transition-all">Learn More <ArrowRight className="h-3 w-3" /></Button>
                </Card>
                <Card className="p-10 bg-white border-none shadow-sm ring-1 ring-black/5 rounded-[40px] hover:shadow-xl hover:-translate-y-2 transition-all group">
                    <div className="bg-[#eab308]/10 p-4 rounded-2xl w-fit mb-8 group-hover:bg-[#eab308] group-hover:text-black transition-colors">
                        <ShieldCheck className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-black mb-3">Cloud Security</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">Your data is stored in enterprise-grade silos with multi-tenant encryption for peace of mind.</p>
                    <Button variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest group-hover:gap-2 transition-all">Learn More <ArrowRight className="h-3 w-3" /></Button>
                </Card>
            </div>
        </div>
      </section>

      {/* SOLUTIONS SECTION */}
      <section className="py-24 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
                <div className="aspect-square bg-white rounded-[60px] shadow-2xl overflow-hidden ring-1 ring-black/5 p-4">
                    <img src="https://picsum.photos/seed/financial/800/800" alt="finance" className="rounded-[44px] w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-10 -left-10 p-8 bg-white rounded-[40px] shadow-2xl border border-black/5 space-y-4 max-w-xs animate-float">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Trusted by 2M+ Users</p>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-muted" />)}
                    </div>
                    <p className="text-sm font-black uppercase leading-tight tracking-tight">Our Platform scales with your ambition.</p>
                </div>
            </div>
            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 text-[#eab308] font-black uppercase text-[10px] tracking-widest">
                        <div className="h-1 w-6 bg-[#eab308] rounded-full" /> About Us
                    </div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter leading-[0.9] text-black">
                        Expert Solutions for <br /> <span className="text-[#eab308]">Your Future</span>
                    </h2>
                </div>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-lg">
                    Our comprehensive suite provides expert guidance in inventory management, expense tracking, point of sale operations, and real-time financial reporting for shops of all sizes.
                </p>
                <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#eab308] rounded-lg flex items-center justify-center text-black"><Globe className="h-4 w-4" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">50+ Countries Worldwide</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#eab308] rounded-lg flex items-center justify-center text-black"><Smartphone className="h-4 w-4" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Over 500k+ App Downloads</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#eab308] rounded-lg flex items-center justify-center text-black"><Users className="h-4 w-4" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">99% Customer Satisfaction</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#eab308] rounded-lg flex items-center justify-center text-black"><CheckCircle2 className="h-4 w-4" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">24/7 Customer Support</span>
                    </div>
                </div>
                <div className="pt-4">
                    <Button asChild size="lg" className="h-14 px-10 font-black uppercase tracking-widest shadow-2xl bg-black text-white hover:bg-black/90 rounded-2xl">
                        <Link href="/signup">Start Free Trial</Link>
                    </Button>
                </div>
                <div className="grid grid-cols-3 gap-8 pt-10 border-t border-black/5">
                    <div className="text-center">
                        <p className="text-2xl font-black text-black">24K+</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Active Nodes</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-black">$16M+</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Processed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-black">160M+</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Transactions</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-24 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 text-[#eab308] font-black uppercase text-[10px] tracking-widest mx-auto">
                    <div className="h-1 w-6 bg-[#eab308] rounded-full" /> Plans and Pricing
                </div>
                <h2 className="text-5xl font-black uppercase tracking-tighter text-black">Transparent pricing for all</h2>
                <p className="text-muted-foreground text-sm font-medium">Every shop is unique. Find the perfect plan for you.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* GROWTH PLAN */}
                <div className="p-12 rounded-[50px] bg-[#eab308] text-black space-y-8 relative overflow-hidden shadow-2xl group border-4 border-black">
                    <div className="absolute top-10 right-10 opacity-10 group-hover:rotate-12 transition-transform duration-500"><TrendingUp className="h-32 w-32" /></div>
                    <div className="space-y-4 relative z-10">
                        <Badge className="bg-black text-[#eab308] font-black text-[10px] uppercase h-6 px-3 border-none">GROWTH / BEST FOR SME</Badge>
                        <p className="text-sm font-bold opacity-80 max-w-[200px]">Designed for personal use and growing shops.</p>
                    </div>
                    <div className="flex items-baseline relative z-10">
                        <span className="text-4xl font-black">KES 2,500</span>
                        <span className="text-sm font-bold ml-1 opacity-60">/ Month</span>
                    </div>
                    <Button asChild size="lg" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl bg-white text-black hover:bg-white/90 border-none shadow-xl">
                        <Link href="/signup">Get Started</Link>
                    </Button>
                    <ul className="space-y-4 pt-4 relative z-10">
                        {['Advanced Analytics & Insights', 'Customizable Financial Reports', 'Multi-User Account (Up to 5 users)', 'Automated Expense Tracking', 'Priority Email Support'].map(item => (
                            <li key={item} className="flex items-center gap-3 text-xs font-bold">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* PROFESSIONAL PLAN */}
                <div className="p-12 rounded-[50px] bg-black text-white space-y-8 relative overflow-hidden shadow-2xl group border-4 border-transparent">
                    <div className="absolute top-10 right-10 opacity-10 group-hover:rotate-12 transition-transform duration-500"><Globe className="h-32 w-32" /></div>
                    <div className="space-y-4 relative z-10">
                        <Badge variant="outline" className="text-white border-white/20 font-black text-[10px] uppercase h-6 px-3">PROFESSIONAL</Badge>
                        <p className="text-sm font-bold opacity-60 max-w-[200px]">Designed for large scale enterprises and clusters.</p>
                    </div>
                    <div className="flex items-baseline relative z-10">
                        <span className="text-4xl font-black">KES 7,500</span>
                        <span className="text-sm font-bold ml-1 opacity-40">/ Month</span>
                    </div>
                    <Button asChild size="lg" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl bg-[#eab308] text-black hover:bg-[#d97706] border-none shadow-xl">
                        <Link href="/signup">Get Started</Link>
                    </Button>
                    <ul className="space-y-4 pt-4 relative z-10">
                        {['Enterprise Intelligence Engine', 'Multi-Node Synchronization', 'Unlimited User Accounts', 'Real-time GPS Asset Tracking', '24/7 Priority Concierge Support'].map(item => (
                            <li key={item} className="flex items-center gap-3 text-xs font-bold">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#eab308]" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto p-12 lg:p-24 bg-black rounded-[60px] text-center space-y-12 relative overflow-hidden shadow-2xl border-b-8 border-b-[#eab308]">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><LayoutDashboard className="h-96 w-96" /></div>
             <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#eab308] text-black px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">
                    Ready to deploy?
                </div>
                <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter text-white leading-none">
                    Smart Business Solutions for <br /> <span className="text-[#eab308]">a Brighter Tomorrow</span>
                </h2>
                <p className="text-white/60 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                    We are a forward-thinking business management company dedicated to simplifying your operations and helping your shop achieve lasting success.
                </p>
                <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="h-16 px-12 font-black uppercase tracking-widest shadow-2xl bg-[#eab308] text-black hover:bg-[#d97706] rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Get Started Now</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 px-12 font-black uppercase tracking-widest border-2 border-white/20 text-white hover:bg-white/5 rounded-2xl active:scale-95 transition-all">
                        <Link href="/support/contact">Talk to Expert</Link>
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
    </MarketingWrapper>
  );
}
