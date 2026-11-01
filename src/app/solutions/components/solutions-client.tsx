
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Monitor, 
    GraduationCap, 
    Settings2, 
    ArrowRight, 
    CheckCircle2, 
    ShieldCheck, 
    BarChart3,
    Smartphone,
    Globe,
    Cpu,
    MessagesSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import placeholderImages from '@/app/lib/placeholder-images.json';

type Category = 'business' | 'school' | 'services';

export function SolutionsClient() {
    const [activeCategory, setActiveCategory] = useState<Category>('business');

    const animations = {
        fadeIn: {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
            transition: { duration: 0.5 }
        }
    };

    const categories = [
        { id: 'business', label: 'Business Software', icon: Monitor },
        { id: 'school', label: 'School Solutions', icon: GraduationCap },
        { id: 'services', label: 'Tech Services', icon: Settings2 },
    ];

    return (
        <div className="space-y-24 pb-20">
            
            {/* HERO SECTION */}
            <section className="relative px-6 pt-20 overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        className="space-y-8 text-center lg:text-left z-10"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-full shadow-lg">
                            <Zap className="h-3.5 w-3.5 fill-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Solutions Ecosystem</span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
                            Everything Your <br />
                            <span className="text-primary">Business Needs</span> <br />
                            To Go Digital.
                        </h1>
                        <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-xl leading-relaxed mx-auto lg:mx-0">
                            Discover powerful software solutions, smart management systems and digital services designed to simplify operations, improve efficiency and support growth.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                            <Button className="h-14 px-10 font-black uppercase tracking-widest text-[11px] shadow-xl rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all">
                                Explore Our Solutions
                            </Button>
                            <Button variant="outline" className="h-14 px-10 font-black uppercase tracking-widest text-[11px] border-2 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white transition-all">
                                Request a Demo
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="relative"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <Card className="bg-white/70 backdrop-blur-xl border-none shadow-2xl rounded-[2.5rem] p-3 overflow-hidden ring-1 ring-black/5">
                            <img 
                                src={placeholderImages.branding.solutions_showcase.url} 
                                alt="Business Hub Ecosystem" 
                                className="rounded-[2rem] w-full h-auto object-cover aspect-[16/10]"
                            />
                        </Card>
                        <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-black/5 animate-bounce-slow">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CATEGORY NAV */}
            <section className="px-6 sticky top-24 z-30">
                <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border shadow-lg flex justify-between gap-1">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as Category)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest",
                                activeCategory === cat.id 
                                    ? "bg-primary text-white shadow-md" 
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <cat.icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* DYNAMIC CONTENT */}
            <section className="px-6 min-h-[600px]">
                <div className="max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        {activeCategory === 'business' && (
                            <motion.div key="business" {...animations.fadeIn} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <ProductCard 
                                    title="Business Management System"
                                    desc="A high-fidelity central node for managing multi-tenant operations, inventory silos, and cross-channel sales."
                                    icon={Monitor}
                                    tags={['Retail', 'Tech', 'Services']}
                                    features={['Real-time Inventory', 'M-Pesa Reconciliation', 'KRA Reporting']}
                                />
                                <ProductCard 
                                    title="Point of Sale Systems"
                                    desc="Ultra-fast transaction engine with integrated hardware scanning and split-payment processing logic."
                                    icon={Smartphone}
                                    tags={['Hardware', 'Supermarkets']}
                                />
                                <ProductCard 
                                    title="Hotel & Restaurant Hub"
                                    desc="Table management, kitchen display systems, and automated billing for the hospitality sector."
                                    icon={Monitor}
                                    tags={['Hospitality', 'Bars']}
                                />
                                <ProductCard 
                                    title="Human Resource Management"
                                    desc="Staff attendance tracking, digital rosters, and automated payroll nodes."
                                    icon={ShieldCheck}
                                    tags={['Internal Ops']}
                                />
                                <ProductCard 
                                    title="Hospital & Clinic Node"
                                    desc="Patient record silos, appointment scheduling, and pharmacy stock management."
                                    icon={ShieldCheck}
                                    tags={['Healthcare']}
                                />
                                <ProductCard 
                                    title="E-commerce Engine"
                                    desc="Sync your shop inventory directly to a customer-facing digital storefront with M-Pesa checkout."
                                    icon={Globe}
                                    tags={['Digital Sales']}
                                />
                            </motion.div>
                        )}

                        {activeCategory === 'school' && (
                            <motion.div key="school" {...animations.fadeIn} className="space-y-12">
                                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/20 shadow-2xl flex flex-col lg:flex-row gap-12 items-center">
                                    <div className="flex-1 space-y-6">
                                        <Badge className="bg-primary text-white px-3 py-1 font-black uppercase text-[9px]">Academic Node</Badge>
                                        <h2 className="text-3xl font-black uppercase tracking-tight">Integrated School Management</h2>
                                        <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                                            A sophisticated platform designed to handle the complexities of academic and administrative operations. 
                                            From admissions to alumni management, everything is centralized in one secure cloud node.
                                        </p>
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                            {[
                                                'Fees Management & Online Payments',
                                                'Student Records & Admissions',
                                                'Exams & Automated Results',
                                                'Staff & Teacher Portals',
                                                'Transport & Library Tracking',
                                                'Parent-Teacher Communication'
                                            ].map(item => (
                                                <li key={item} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight">
                                                    <div className="bg-green-500/10 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-green-600" /></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="pt-4 flex gap-4">
                                            <Button className="h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg rounded-xl">Request Demo</Button>
                                            <Button variant="outline" className="h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2 rounded-xl">View Packages</Button>
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-[450px]">
                                        <Card className="p-3 border-none bg-black/5 ring-1 ring-black/5 rounded-3xl overflow-hidden shadow-inner">
                                            <img src={placeholderImages.branding.dashboard_preview.url} className="rounded-2xl" alt="School Dashboard" />
                                        </Card>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeCategory === 'services' && (
                            <motion.div key="services" {...animations.fadeIn} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ServiceCard 
                                    title="Software Development" 
                                    desc="Tailor-made management systems and mobile apps built specifically for your organization's logic."
                                    icon={Cpu}
                                />
                                <ServiceCard 
                                    title="Website & UI Design" 
                                    desc="Professional corporate identities and high-speed web presence nodes optimized for SEO."
                                    icon={Globe}
                                />
                                <ServiceCard 
                                    title="IT Consultancy" 
                                    desc="Expert advice on infrastructure scaling, cybersecurity, and digital transformation strategy."
                                    icon={Settings2}
                                />
                                <ServiceCard 
                                    title="Cloud & Hosting" 
                                    desc="Reliable, secure deployment silos for your existing systems with 99.9% uptime guarantee."
                                    icon={Cpu}
                                />
                                <ServiceCard 
                                    title="Payment Gateways" 
                                    desc="Integrating M-Pesa, Bank, and International Card payments into your existing workflows."
                                    icon={Monitor}
                                />
                                <ServiceCard 
                                    title="Technical Support" 
                                    desc="24/7 priority maintenance and troubleshooting nodes for your entire software stack."
                                    icon={MessagesSquare}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* BRANDING STRIP */}
            <section className="px-6">
                 <div className="max-w-7xl mx-auto p-12 bg-black text-white rounded-[3rem] text-center space-y-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <BarChart3 className="h-full w-full" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Connected Ecosystem. Simpler Management.</h2>
                        <p className="text-gray-400 font-medium text-sm max-w-2xl mx-auto">
                            Join thousands of organizations using Business Hub to streamline their operations across East Africa.
                        </p>
                        <div className="pt-6 flex justify-center gap-6">
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-primary">150+</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Deployed Systems</span>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-primary">24/7</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Active Support</span>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-primary">100%</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Cloud Uptime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ProductCard({ title, desc, icon: Icon, tags, features }: any) {
    return (
        <Card className="bg-white/60 backdrop-blur-xl border-none ring-1 ring-black/5 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group">
            <CardContent className="p-8 space-y-6">
                <div className="bg-primary/5 p-4 rounded-2xl w-fit group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                    <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{desc}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {tags?.map((t: string) => <Badge key={t} variant="outline" className="text-[7px] font-black uppercase border-primary/20 h-4 px-2">{t}</Badge>)}
                </div>
                <Button variant="ghost" className="w-full justify-between h-10 px-4 font-black uppercase text-[9px] tracking-widest hover:bg-primary hover:text-white rounded-xl">
                    Learn More <ArrowRight className="h-3 w-3" />
                </Button>
            </CardContent>
        </Card>
    );
}

function ServiceCard({ title, desc, icon: Icon }: any) {
    return (
        <Card className="bg-white/40 backdrop-blur-lg border-none ring-1 ring-black/5 rounded-3xl p-8 hover:bg-white/70 transition-all group">
            <div className="space-y-6">
                <div className="bg-black p-3 rounded-2xl w-fit group-hover:bg-primary transition-colors text-white">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-base font-black uppercase tracking-tight">{title}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{desc}</p>
                </div>
                <Button variant="link" className="p-0 h-auto text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                    Get Quotation
                </Button>
            </div>
        </Card>
    );
}
