'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Zap, 
    CheckCircle2, 
    Star, 
    Building2, 
    Package, 
    Utensils, 
    Beer, 
    Coffee, 
    Truck, 
    Clock, 
    Phone, 
    Mail, 
    FileSearch 
} from 'lucide-react';
import Link from 'next/link';
import placeholderImages from '@/app/lib/placeholder-images.json';

export function LandingPage() {
  const industries = [
    { name: 'Restaurants', icon: Utensils, desc: 'Kitchen printers, tips, tables, and tabs.' },
    { name: 'Bars', icon: Beer, desc: 'Fast tabs, age verification, and high-speed service.' },
    { name: 'Food Trucks', icon: Truck, desc: 'Mobile POS with cellular sync for on-the-go sales.' },
    { name: 'Retail Stores', icon: Package, desc: 'Barcode scanning, inventory, and categories.' },
    { name: 'Cafes', icon: Coffee, desc: 'Quick-pay, loyalty points, and simple modifiers.' },
    { name: 'Small Businesses', icon: Building2, desc: 'Simple tools to grow and track shop profit.' },
    { name: 'Service Businesses', icon: Building2, desc: 'Staff tracking, history, and booking links.' }
  ];

  const commonProblems = [
    "Slow Checkout Processes", "Confusing Financial Reports", "Inventory Shrinkage & Loss",
    "High Processing Fees", "Outdated Hardware", "Poor Local Support",
    "Staff Training Friction", "Printer & Terminal Issues", "Cash Drawer Shortages",
    "Untracked Refunds & Voids", "Merchant Statement Confusion", "Weak Employee Permissions"
  ];

  const testimonials = [
    { name: "Mary Wanjiku", loc: "Nairobi, KE", text: "Great service, great product. Simon is the man! If you need a system for your shop, reach out to them. You will be glad you did." },
    { name: "Loice Wambui", loc: "Nakuru, KE", text: "One of the best customer services. Simon and his team are amazing, patient, and available at all hours. They helped us set up perfectly." },
    { name: "Michael Otieno", loc: "Mombasa, KE", text: "Been with them for years. Reliable for our bar system and always willing to troubleshoot even late at night." },
    { name: "Samuel Kamau", loc: "Nairobi, KE", text: "Simon (the owner) will call and take care of issues even on weekends. Top tier support that actually understands our business." }
  ];

  return (
    <div className="space-y-0 overflow-x-hidden selection:bg-[#eab308] selection:text-black">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 lg:pt-24 lg:pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left-4 duration-1000">
                <div className="inline-flex items-center gap-2 bg-[#eab308]/10 text-[#eab308] px-4 py-2 rounded-full border border-[#eab308]/20 shadow-sm mx-auto lg:mx-0">
                    <Zap className="h-4 w-4 fill-[#eab308]" />
                    <span className="text-xs font-bold tracking-tight text-black">Professional Shop Infrastructure</span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-black">
                    Stop Stock Loss. <br />
                    <span className="text-[#eab308]">Scale Your Profits.</span>
                </h1>
                <p className="text-sm sm:text-lg text-muted-foreground font-medium max-w-lg leading-relaxed mx-auto lg:mx-0">
                    Stock shrinkage and manual errors are the silent killers of retail. Shop Manager provides the high-speed scanning and automated M-Pesa reconciliation you need to keep your shop running perfectly.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4 px-4 sm:px-0">
                    <Button asChild className="h-16 px-12 font-bold text-base bg-black text-white hover:bg-black/90 rounded-2xl shadow-xl active:scale-95 transition-all">
                        <Link href="/signup">Start Free Trial</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-16 px-12 font-bold text-base border-2 border-black/10 rounded-2xl bg-white hover:bg-muted/50 active:scale-95 transition-all">
                        <Link href="/support/contact">Book a Demo</Link>
                    </Button>
                </div>
            </div>
            
            <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-300">
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#eab308]/20 to-transparent rounded-full blur-3xl opacity-30" />
                <Card className="relative border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-muted/20 p-2 ring-1 ring-black/5">
                    <img 
                      src={placeholderImages.branding.hero_pos.url} 
                      alt="Shop Manager Hardware" 
                      className="rounded-[2rem] w-full h-auto object-cover aspect-[4/3]"
                      data-ai-hint={placeholderImages.branding.hero_pos.hint}
                    />
                </Card>
            </div>
        </div>
      </section>

      {/* INDUSTRIES GRID */}
      <section className="py-20 bg-muted/10 border-y border-black/5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Industries We Serve</h2>
                <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto">We specialize in tailoring POS workflows for your specific operation.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {industries.map((ind) => (
                    <Card key={ind.name} className="border-none ring-1 ring-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden group">
                        <CardHeader className="p-8 text-center space-y-4">
                            <div className="bg-black p-4 rounded-2xl w-fit mx-auto group-hover:bg-[#eab308] transition-colors">
                                <ind.icon className="h-7 w-7 text-[#eab308] group-hover:text-black" />
                            </div>
                            <CardTitle className="text-base font-bold">{ind.name}</CardTitle>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">{ind.desc}</p>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* STRATEGIC REVIEW SECTION */}
      <section className="py-24 bg-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 order-2 lg:order-1">
                <div className="space-y-4">
                    <Badge className="bg-[#eab308] text-black font-bold text-xs px-4 h-7">Expert Review</Badge>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">Review First, Change Second.</h2>
                </div>
                <p className="text-sm sm:text-lg text-muted-foreground font-medium leading-relaxed">
                    Not every business needs a complete overhaul. We start by reviewing your current setup, payment processing, and merchant statements to identify where you're losing money.
                </p>
                <div className="p-6 bg-muted/30 rounded-3xl border-2 border-dashed border-black/5 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary p-2.5 rounded-lg mt-1"><FileSearch className="h-5 w-5 text-white" /></div>
                        <div>
                            <p className="text-sm font-bold">Identify Revenue Leakage</p>
                            <p className="text-xs text-muted-foreground font-medium mt-1">Our review pinpoint areas where manual errors and missing stock are impacting your bottom line.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="relative order-1 lg:order-2">
                <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-muted/20 p-2 ring-1 ring-black/5">
                    <img 
                      src={placeholderImages.branding.review_section.url} 
                      alt="Business Review" 
                      className="rounded-[2rem] w-full h-auto object-cover aspect-video"
                      data-ai-hint={placeholderImages.branding.review_section.hint}
                    />
                </Card>
            </div>
        </div>
      </section>

      {/* COMMON PROBLEMS GRID */}
      <section className="py-20 bg-muted/5 px-4 sm:px-6 border-y">
        <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">System Benefits</h3>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Solving Your Daily Headaches</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {commonProblems.map((prob, i) => (
                    <div key={i} className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-black/5 group hover:shadow-lg transition-all">
                        <div className="bg-green-500/10 p-2.5 rounded-full">
                            <CheckCircle2 className="h-5 w-5 text-[#22c55e] shrink-0" />
                        </div>
                        <span className="text-sm font-semibold opacity-80 group-hover:opacity-100">{prob}</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* LOCAL SUPPORT SECTION */}
      <section className="py-24 bg-black text-white px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="h-96 w-96" /></div>
        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Badge className="bg-[#eab308] text-black font-bold text-xs px-4 h-7">Nairobi Support Node</Badge>
                        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">Local Support For Local Shops.</h2>
                    </div>
                    <p className="text-base sm:text-xl text-white/50 font-medium leading-relaxed">
                        Nairobi businesses need support that understands East African operations. We provide local setup, training, and 24/7 technical assistance.
                    </p>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <p className="text-4xl font-bold text-[#eab308]">24/7</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Cloud Availability</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-bold text-[#eab308]">100%</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Local Voice Support</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white/5 p-2 ring-1 ring-white/10">
                        <img 
                          src={placeholderImages.branding.support_section.url} 
                          alt="Technical Support" 
                          className="rounded-[2rem] w-full h-auto object-cover aspect-video"
                          data-ai-hint={placeholderImages.branding.support_section.hint}
                        />
                    </Card>
                    <div className="mt-8 bg-white/5 p-8 sm:p-12 rounded-[3rem] border border-white/10 space-y-8 shadow-2xl">
                        <h3 className="text-2xl font-bold tracking-tight">Reduce Hidden Fees</h3>
                        <p className="text-sm text-white/60 font-medium leading-relaxed">We review your merchant statements and work to lower your costs. Most shops save significantly without switching providers.</p>
                        <Button asChild className="h-16 px-10 w-full font-bold text-base bg-[#eab308] text-black hover:bg-[#eab308]/90 rounded-2xl shadow-xl transition-all">
                            <Link href="/support/contact">Get a Free Review</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Trusted by Shop Owners</h2>
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-widest">Real feedback from across Kenya.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {testimonials.map((t, i) => (
                    <Card key={i} className="border-none ring-1 ring-black/5 shadow-xl rounded-3xl p-8 space-y-6 bg-muted/5">
                        <div className="flex gap-1"><Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /> <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /> <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /> <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /> <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" /></div>
                        <p className="text-sm font-medium leading-relaxed italic text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
                        <div className="pt-4 border-t border-black/5">
                            <p className="text-sm font-bold">{t.name}</p>
                            <p className="text-xs font-medium opacity-50">{t.loc}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* CTA / HOURS */}
      <section className="py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto p-12 sm:p-24 bg-[#1a1a1a] rounded-[40px] sm:rounded-[60px] text-center space-y-16 relative overflow-hidden shadow-2xl border-b-8 border-b-[#eab308]">
             <div className="relative z-10 space-y-12">
                <div className="space-y-6">
                    <h2 className="text-4xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
                        Ready to <span className="text-[#eab308]">Optimize?</span>
                    </h2>
                    <p className="text-white/40 font-medium text-lg sm:text-xl max-w-2xl mx-auto">Join thousands of Kenyan shop owners who are using high-speed data to grow.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-white/60">
                    <div className="space-y-3">
                        <Clock className="h-8 w-8 text-[#eab308] mx-auto" />
                        <p className="text-xs font-bold uppercase tracking-widest">Office Hours</p>
                        <p className="text-sm font-semibold text-white">Mon-Fri: 8:00 AM - 5:00 PM</p>
                    </div>
                    <div className="space-y-3">
                        <Phone className="h-8 w-8 text-[#eab308] mx-auto" />
                        <p className="text-xs font-bold uppercase tracking-widest">Support Line</p>
                        <p className="text-sm font-semibold text-white">+254 758 673 616</p>
                    </div>
                    <div className="space-y-3">
                        <Mail className="h-8 w-8 text-[#eab308] mx-auto" />
                        <p className="text-xs font-bold uppercase tracking-widest">Official Channel</p>
                        <p className="text-sm font-semibold text-white truncate">info@simonstyles.co.ke</p>
                    </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row justify-center gap-6">
                    <Button asChild size="lg" className="h-16 px-12 font-bold text-base shadow-2xl bg-[#eab308] text-black hover:bg-[#eab308]/90 rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Start Your Shop</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 px-12 font-bold text-base border-2 border-white/20 text-white hover:bg-white/5 rounded-2xl active:scale-95 transition-all">
                        <Link href="/support/contact">Speak With an Expert</Link>
                    </Button>
                </div>
             </div>
        </div>
      </section>
    </div>
  );
}
