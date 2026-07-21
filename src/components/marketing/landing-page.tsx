'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
    ShoppingCart, 
    ChevronRight, 
    Zap, 
    ShieldCheck, 
    Users,
    BookOpen,
    MessageSquare,
    Briefcase,
    Printer,
    Clock,
    Rocket
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { MarketingNavbar } from './marketing-navbar';
import { MarketingFooter } from './marketing-footer';

const FeatureCard = ({ icon: Icon, title, description, badge, href }: { icon: any, title: string, description: string, badge?: string, href: string }) => (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group bg-white">
        <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/5 p-3 rounded-xl group-hover:bg-primary transition-colors">
                    <Icon className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                {badge && <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest">{badge}</Badge>}
            </div>
            <h3 className="text-lg font-black uppercase tracking-tighter mb-1">{title}</h3>
            <p className="text-muted-foreground leading-relaxed text-xs">{description}</p>
            <Link href={href} className="mt-3 flex items-center text-primary font-bold text-[10px] cursor-pointer group-hover:underline uppercase tracking-wider">
                Learn more <ChevronRight className="ml-1 h-2.5 w-2.5" />
            </Link>
        </CardContent>
    </Card>
);

const ValueProp = ({ title, description, icon: Icon }: any) => (
    <div className="space-y-3">
        <div className="bg-primary p-2 rounded-lg w-fit">
            <Icon className="h-4 w-4 text-white" />
        </div>
        <h4 className="text-sm font-black uppercase tracking-tight">{title}</h4>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
    </div>
);

const StatItem = ({ label, value }: any) => (
    <div className="text-center space-y-1">
        <div className="text-3xl font-black tracking-tighter text-primary">{value}</div>
        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
);

export function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-black overflow-x-hidden selection:bg-primary selection:text-white">
            <MarketingNavbar />

            {/* Hero Section */}
            <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-primary/5 to-white">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-[0.95]">
                            Your life's work,<br />
                            <span className="text-primary">powered by our life's work</span>
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                            A unique and powerful software suite to transform the way you work. Designed for businesses of all sizes, built by a company that values your privacy.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button asChild className="h-14 px-10 text-lg font-black uppercase tracking-widest shadow-xl rounded-xl w-full sm:w-auto active:scale-95 transition-all bg-accent text-accent-foreground hover:bg-accent/90">
                            <Link href="/signup">Get Started For Free</Link>
                        </Button>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            No credit card required &bull; Instant activation
                        </p>
                    </div>
                </div>
            </section>

            {/* Featured Apps Grid */}
            <section id="products" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Featured apps</h2>
                            <p className="text-muted-foreground font-medium text-sm max-w-xl">
                                Each module is designed to stand alone or work together seamlessly in our cloud ecosystem.
                            </p>
                        </div>
                        <Button variant="link" asChild className="font-black uppercase tracking-widest text-primary p-0 h-auto text-[10px]">
                            <Link href="/solutions/crm">Explore all products <ChevronRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard 
                            icon={Users} 
                            title="CRM" 
                            description="Comprehensive CRM platform for customer-facing teams to track every interaction."
                            badge="Core"
                            href="/solutions/crm"
                        />
                        <FeatureCard 
                            icon={MessageSquare} 
                            title="Mail" 
                            description="Secure, encrypted email service for professional teams of all sizes."
                            badge="Secure"
                            href="/solutions/mail"
                        />
                        <FeatureCard 
                            icon={BookOpen} 
                            title="Books" 
                            description="Powerful accounting platform for growing businesses to manage profit and loss."
                            badge="Accounting"
                            href="/solutions/accounting"
                        />
                        <FeatureCard 
                            icon={ShoppingCart} 
                            title="Sell" 
                            description="Modern Point of Sale for retail and service nodes with M-Pesa integration."
                            badge="New"
                            href="/pos"
                        />
                        <FeatureCard 
                            icon={Briefcase} 
                            title="Desk" 
                            description="Helpdesk software to deliver great customer support and resolve tickets fast."
                            badge="Service"
                            href="/desk"
                        />
                        <FeatureCard 
                            icon={Printer} 
                            title="Papers" 
                            description="High-fidelity document engine for bank-grade invoices and professional reports."
                            badge="Pro"
                            href="/documents"
                        />
                    </div>
                </div>
            </section>

            {/* All-in-one suite section */}
            <section className="py-24 px-6 bg-muted/30">
                <div className="max-w-7xl mx-auto text-center space-y-8">
                    <div className="space-y-3">
                        <Badge variant="outline" className="border-secondary text-secondary font-black uppercase tracking-[0.2em] px-3 py-0.5 text-[8px]">Unified Platform</Badge>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">The operating system <br/> for business</h2>
                        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                            Run your entire business on ShopManager—our unified platform with modular applications for all your operational needs.
                        </p>
                    </div>
                    <Button className="h-14 px-10 text-lg font-black uppercase tracking-widest shadow-2xl rounded-xl active:scale-95 transition-all bg-accent text-accent-foreground hover:bg-accent/90">
                        TRY SHOPMANAGER ONE
                    </Button>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-2">
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">The principles that drive us</h2>
                        <p className="text-muted-foreground font-medium text-sm">We build for the long-term, prioritize your privacy, and obsess over software craft.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <ValueProp 
                            icon={Clock}
                            title="Long-term commitment" 
                            description="30+ years of running a profitable organization gives us a good sense of challenges. We take pride in running a sustainable business."
                        />
                        <ValueProp 
                            icon={Users}
                            title="Customer-first philosophy" 
                            description="It's our customers' trust and goodwill that has helped us establish a strong position. No matter the size, we're here to help."
                        />
                        <ValueProp 
                            icon={ShieldCheck}
                            title="Privacy as a priority" 
                            description="We do not own or sell your data. The only way we make money is from software license fees you pay us."
                        />
                        <ValueProp 
                            icon={Rocket}
                            title="Focus on R&D" 
                            description="Software is our craft. We prefer to own the entire technology stack, including running our data centers globally."
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 px-6 border-y border-black/5 bg-primary/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                         <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Business Software.<br/><span className="text-primary">Our Craft. Our Passion.</span></h3>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
                        <StatItem value="150M+" label="Users Globally" />
                        <StatItem value="150+" label="Countries Served" />
                        <StatItem value="60+" label="Products" />
                        <StatItem value="10+" label="Years in Business" />
                        <StatItem value="5K+" label="Professional Clients" />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 bg-black text-white text-center">
                <div className="max-w-2xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Ready to do your best work?</h2>
                    <p className="text-base text-gray-400 font-medium">Join thousands of entrepreneurs building their dreams on our platform.</p>
                    <div className="pt-6">
                         <Button asChild className="h-16 px-12 text-xl font-black uppercase tracking-widest shadow-2xl rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 transition-all active:scale-95">
                            <Link href="/signup">Sign Up Now</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <MarketingFooter />
        </div>
    );
}