
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    ShoppingCart, 
    Package, 
    Printer, 
    Check, 
    ChevronRight, 
    Zap, 
    ShieldCheck, 
    Users,
    Laptop,
    Wallet
} from 'lucide-react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
        <CardContent className="pt-8">
            <div className="bg-primary/5 p-4 rounded-2xl w-fit mb-6 group-hover:bg-primary transition-colors">
                <Icon className="h-8 w-8 text-primary group-hover:text-white" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
    </Card>
);

const PricingPlan = ({ title, price, description, features, highlighted = false, tier = "" }: any) => (
    <Card className={cn(
        "relative overflow-hidden flex flex-col border-2 transition-all duration-500",
        highlighted ? "border-primary shadow-2xl scale-105 z-10" : "border-border shadow-md"
    )}>
        {highlighted && (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-black px-4 py-1 uppercase tracking-widest rounded-bl-xl">
                Most Popular
            </div>
        )}
        <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black uppercase tracking-tighter">{title}</CardTitle>
            <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter">{price}</span>
                {price !== "Free" && <span className="text-sm font-bold text-muted-foreground">/ month</span>}
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-2">{description}</p>
        </CardHeader>
        <CardContent className="p-8 pt-4 flex-grow space-y-4">
            {features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="bg-green-100 p-1 rounded-full">
                        <Check className="h-3 w-3 text-green-600" strokeWidth={4} />
                    </div>
                    <span className="text-sm font-medium">{f}</span>
                </div>
            ))}
        </CardContent>
        <CardFooter className="p-8 pt-0">
            <Button asChild className={cn("w-full h-12 font-black uppercase tracking-widest", highlighted ? "" : "variant-outline")} variant={highlighted ? "default" : "outline"}>
                <Link href="/signup">Get Started</Link>
            </Button>
        </CardFooter>
    </Card>
);

import { cn } from '@/lib/utils';

export function LandingPage() {
    const plans = [
        {
            title: "Standard",
            price: "Free",
            description: "For small shops starting their journey.",
            features: [
                "Up to 50 items",
                "100 Sales per month",
                "Professional Papers",
                "1 Shop Location"
            ]
        },
        {
            title: "Growth",
            price: "KES 2,500",
            description: "Perfect for expanding tech businesses.",
            features: [
                "Up to 500 items",
                "1000 Sales per month",
                "Custom Branding & Logos",
                "Staff Permissions Control",
                "Cloud Data Export"
            ],
            highlighted: true
        },
        {
            title: "Enterprise",
            price: "KES 7,500",
            description: "The complete solution for high-volume nodes.",
            features: [
                "Unlimited Items",
                "Unlimited Transactions",
                "Live GPS Tracking",
                "Priority Support",
                "Full Audit Ledger"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-black overflow-x-hidden">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur border-b border-black/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-xl shadow-lg">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">{APP_NAME}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" asChild className="font-bold hidden sm:flex">
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild className="font-black uppercase tracking-widest shadow-xl">
                            <Link href="/signup">Create Account</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-40 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-[0.2em] px-6 py-1 h-auto text-[10px]">
                        The Professional Choice for Retail
                    </Badge>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
                        Manage your <span className="text-primary">Shop</span> with precision.
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                        A high-fidelity business manager for modern entrepreneurs. Track stock, sell items, and generate bank-grade papers instantly.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <Button asChild size="lg" className="h-16 px-12 text-xl font-black uppercase tracking-widest shadow-2xl rounded-2xl w-full sm:w-auto active:scale-95 transition-all">
                            <Link href="/signup">Start Free Trial <ChevronRight className="ml-2 h-6 w-6" /></Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Everything you need</h2>
                        <p className="text-muted-foreground font-medium max-w-xl mx-auto">Powerful modules simplified for your team to use without complex training.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={ShoppingCart} 
                            title="Sell Items" 
                            description="Process cash, M-Pesa, and bank sales in seconds. Automatically updates your stock list."
                        />
                        <FeatureCard 
                            icon={Package} 
                            title="Stock List" 
                            description="Manage high-value laptops and accessories with serial number precision. Never lose a unit again."
                        />
                        <FeatureCard 
                            icon={Printer} 
                            title="View Papers" 
                            description="Generate professional Invoices, Receipts, and Delivery Notes that look as sharp as bank statements."
                        />
                        <FeatureCard 
                            icon={Users} 
                            title="Staff Access" 
                            description="Invite your team and control exactly what they can see or modify in your shop."
                        />
                        <FeatureCard 
                            icon={Wallet} 
                            title="Money Reports" 
                            description="See your profit and loss at a glance. Know exactly how much your business is making."
                        />
                        <FeatureCard 
                            icon={ShieldCheck} 
                            title="Cloud Secure" 
                            description="Your data is encrypted and backed up daily. Access your shop node from any device, anywhere."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter">Simple Pricing</h2>
                        <p className="text-muted-foreground font-medium">Choose the plan that fits your business node size.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {plans.map((plan, i) => (
                            <PricingPlan key={i} {...plan} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 bg-black text-white border-t border-white/10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                             <div className="bg-primary p-2 rounded-xl">
                                <Zap className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">{APP_NAME}</h2>
                        </div>
                        <p className="text-gray-400 font-medium max-w-sm leading-relaxed">
                            Professional business suite designed for clarity, reliability, and growth. Empowering entrepreneurs with enterprise tools.
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 pt-10">
                            Powered by simonstyless technologies limited
                        </p>
                    </div>
                    <div className="flex flex-col md:items-end space-y-4">
                        <p className="font-black uppercase text-xs tracking-widest text-gray-500">Global Node Status</p>
                        <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-green-500 text-xs font-black uppercase tracking-widest tracking-tighter">All systems nominal</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
