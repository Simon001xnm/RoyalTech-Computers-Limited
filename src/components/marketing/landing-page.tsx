'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Zap, 
    ArrowRight, 
    ShieldCheck, 
    CheckCircle2, 
    TrendingUp,
    LayoutDashboard,
    Star,
    Building2,
    Activity,
    ShoppingCart,
    Percent,
    DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LandingPage() {
  return (
    <div className="space-y-0">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000">
                <div className="inline-flex items-center gap-2 bg-[#eab308]/10 text-[#eab308] px-4 py-1.5 rounded-full border border-[#eab308]/20 shadow-sm">
                    <Badge className="bg-[#eab308] text-black hover:bg-[#eab308] font-black text-[9px] h-5 px-2 border-none">NEW</Badge>
                    <span className="text-[10px] font-black uppercase tracking-widest">Now open across Africa</span>
                </div>
                <h1 className="text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] transition-colors">
                    Run your shop, <br />
                    <span className="text-[#eab308]">the easy way</span>
                </h1>
                <p className="text-base text-muted-foreground font-medium max-w-lg leading-relaxed">
                    A simple tool to help you track your stock, record sales, and manage your money. Perfect for one shop or a chain of branches.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                    <Button asChild size="lg" className="h-14 px-10 font-black uppercase tracking-widest shadow-2xl bg-[#22c55e] text-white hover:bg-[#16a34a] rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Try for Free</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-10 font-black uppercase tracking-widest border-2 rounded-2xl group active:scale-95 transition-all bg-transparent border-muted-foreground/20">
                        <Link href="/company/about" className="flex items-center">
                            See How it Works <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-4 pt-8">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-10 rounded-full border-2 border-background overflow-hidden shadow-md">
                                <img src={`https://picsum.photos/seed/user${i}/64/64`} alt="user" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-[#eab308] text-[#eab308]" />)}
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Used by 2,000+ Shop Owners</p>
                    </div>
                </div>
            </div>
            
            <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-300">
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#eab308]/20 to-transparent rounded-full blur-3xl opacity-30" />
                <div className="relative p-2 rounded-[40px] shadow-2xl ring-1 ring-[#eab308]/10 overflow-hidden bg-muted/20">
                    <img 
                        src="https://picsum.photos/seed/dashboardv3/1200/900" 
                        alt="Business Hub Dashboard" 
                        className="rounded-[32px] w-full h-auto shadow-inner border border-[#eab308]/10" 
                    />
                    <div className="absolute top-10 left-10 p-4 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur rounded-2xl shadow-xl border border-[#eab308]/10 animate-bounce-slow">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-[#22c55e] rounded-full flex items-center justify-center text-white"><CheckCircle2 className="h-4 w-4" /></div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-muted-foreground">Sale Done</p>
                                <p className="text-xs font-black uppercase tracking-tight text-[#22c55e]">Money Received</p>
                            </div>
                         </div>
                    </div>
                    <div className="absolute bottom-10 right-10 p-6 bg-[#1a1a1a] text-white rounded-3xl shadow-2xl w-56 animate-float border border-white/5">
                        <p className="text-[10px] font-bold uppercase opacity-60 mb-2">Our Reach</p>
                        <p className="text-2xl font-black tracking-tighter text-[#eab308]">9 Countries</p>
                        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1">
                            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest text-white">East • West • South Africa</span>
                            <div className="flex justify-between items-center">
                                <span className="text-[7px] font-bold uppercase text-white/30">System Active</span>
                                <div className="flex gap-1">
                                    <div className="h-2 w-2 rounded-full bg-[#eab308]/40" />
                                    <div className="h-2 w-2 rounded-full bg-[#eab308] animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
                { label: 'Sale Success', val: '100%', icon: Activity },
                { label: 'Sales Made', val: '1 Million+', icon: ShoppingCart },
                { label: 'Shop Growth', val: 'High', icon: TrendingUp },
                { label: 'Safe & Secure', val: 'Yes', icon: ShieldCheck },
            ].map((m, i) => (
                <div key={i} className="p-6 rounded-3xl bg-muted/20 border border-muted-foreground/5 flex flex-col items-center text-center space-y-2">
                    <m.icon className="h-5 w-5 text-[#eab308]" />
                    <p className="text-2xl font-black tracking-tighter">{m.val}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</p>
                </div>
            ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 relative" id="products">
        <div className="max-w-7xl mx-auto px-6 space-y-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 text-[#eab308] font-black uppercase text-[10px] tracking-widest">
                        <div className="h-1 w-6 bg-[#eab308] rounded-full" /> What You Get
                    </div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter leading-[0.9]">
                        Everything you need to <br /> grow your business.
                    </h2>
                </div>
                <p className="text-muted-foreground text-sm font-medium max-w-xs">
                    Easy tools built to help you move from a small table to a big shop with many branches.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-10 bg-muted/10 border-none shadow-sm ring-1 ring-muted-foreground/10 rounded-[40px] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl w-fit mb-8 group-hover:bg-[#eab308] transition-colors shadow-lg">
                        <Building2 className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Manage Many Shops</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">Keep an eye on all your shop branches from one phone or computer. Each shop's data is kept separate and safe.</p>
                    <Button variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest group-hover:gap-2 transition-all text-[#eab308] hover:text-[#eab308]">See More <ArrowRight className="h-3 w-3" /></Button>
                </Card>
                <Card className="p-10 bg-muted/10 border-none shadow-sm ring-1 ring-muted-foreground/10 rounded-[40px] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl w-fit mb-8 group-hover:bg-[#eab308] transition-colors shadow-lg">
                        <TrendingUp className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">See Your Profits</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">Know exactly how much money is coming in and how much you are spending. We show you your profit in simple charts.</p>
                    <Button variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest group-hover:gap-2 transition-all text-[#eab308] hover:text-[#eab308]">See More <ArrowRight className="h-3 w-3" /></Button>
                </Card>
                <Card className="p-10 bg-muted/10 border-none shadow-sm ring-1 ring-muted-foreground/10 rounded-[40px] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl w-fit mb-8 group-hover:bg-[#eab308] transition-colors shadow-lg">
                        <ShieldCheck className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Safe and Private</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">Your records are for your eyes only. We use strong digital locks to keep your shop's information private and secure.</p>
                    <Button variant="link" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest group-hover:gap-2 transition-all text-[#eab308] hover:text-[#eab308]">See More <ArrowRight className="h-3 w-3" /></Button>
                </Card>
            </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-24" id="pricing">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 text-[#eab308] font-black uppercase text-[10px] tracking-widest mx-auto">
                    <div className="h-1 w-6 bg-[#eab308] rounded-full" /> Monthly Plans
                </div>
                <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">Simple pricing</h2>
                <p className="text-muted-foreground text-sm font-medium">Choose a plan that fits the size of your business.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="p-12 rounded-[50px] bg-[#eab308] text-black space-y-8 relative overflow-hidden shadow-2xl group border-4 border-black">
                    <div className="absolute top-10 right-10 opacity-10 group-hover:rotate-12 transition-transform duration-500"><TrendingUp className="h-32 w-32" /></div>
                    <div className="space-y-4 relative z-10">
                        <Badge className="bg-black text-[#eab308] font-black text-[10px] uppercase h-6 px-3 border-none">SMALL SHOP / BEST FOR START</Badge>
                        <p className="text-sm font-bold opacity-80 max-w-[200px]">Great for single shops just getting started.</p>
                    </div>
                    <div className="flex items-baseline relative z-10">
                        <span className="text-5xl font-black tracking-tighter">KES 2,500</span>
                        <span className="text-sm font-bold ml-1 opacity-60">/ Month</span>
                    </div>
                    <Button asChild size="lg" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl bg-black text-white hover:bg-black/90 border-none shadow-xl">
                        <Link href="/signup">Start Now</Link>
                    </Button>
                    <ul className="space-y-4 pt-4 relative z-10">
                        {['See your sales charts', 'Print professional receipts', 'Add staff to help you', 'Track your daily expenses', 'Get help when you need it'].map(item => (
                            <li key={item} className="flex items-center gap-3 text-xs font-bold uppercase">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-12 rounded-[50px] bg-[#1a1a1a] text-white space-y-8 relative overflow-hidden shadow-2xl group border-4 border-white/5">
                    <div className="absolute top-10 right-10 opacity-10 group-hover:rotate-12 transition-transform duration-500"><Zap className="h-32 w-32" /></div>
                    <div className="space-y-4 relative z-10">
                        <Badge variant="outline" className="text-white border-[#eab308]/20 font-black text-[10px] uppercase h-6 px-3">BIG BUSINESS</Badge>
                        <p className="text-sm font-bold opacity-60 max-w-[200px]">Made for shops with many branches and many items.</p>
                    </div>
                    <div className="flex items-baseline relative z-10">
                        <span className="text-5xl font-black text-[#eab308] tracking-tighter">KES 7,500</span>
                        <span className="text-sm font-bold ml-1 opacity-40">/ Month</span>
                    </div>
                    <Button asChild size="lg" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl bg-[#eab308] text-black hover:bg-[#eab308]/90 border-none shadow-xl">
                        <Link href="/signup">Start Now</Link>
                    </Button>
                    <ul className="space-y-4 pt-4 relative z-10">
                        {['Manage many shop branches', 'Connect all your shops together', 'No limit on staff members', 'Add your own logo everywhere', 'Get a dedicated assistant'].map(item => (
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

      {/* FINAL CTA SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto p-12 lg:p-24 bg-[#1a1a1a] rounded-[60px] text-center space-y-12 relative overflow-hidden shadow-2xl border-b-8 border-b-[#eab308] border-x border-x-white/5">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><LayoutDashboard className="h-96 w-96" /></div>
             <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#eab308] text-black px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">
                    Ready to start?
                </div>
                <h2 className="text-6xl lg:text-8xl font-black uppercase tracking-tighter text-white leading-[0.85]">
                    Move to the <br /> <span className="text-[#eab308]">Smart Shop Way</span>
                </h2>
                <p className="text-white/60 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                    Join thousands of shop owners who are using our tool to run their businesses better every day.
                </p>
                <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="h-16 px-12 font-black uppercase tracking-widest shadow-2xl bg-[#22c55e] text-white hover:bg-[#16a34a] rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Create My Shop Now</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 px-12 font-black uppercase tracking-widest border-2 border-white/20 text-white hover:bg-white/5 rounded-2xl active:scale-95 transition-all">
                        <Link href="/support/contact">Talk to an Expert</Link>
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
