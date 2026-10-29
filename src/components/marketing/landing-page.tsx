
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    Users,
    Utensils,
    Scissors,
    Beer,
    Coffee,
    Truck,
    Clock,
    MapPin,
    Phone,
    Mail,
    FileSearch,
    AlertCircle,
    UserCheck,
    Printer
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LandingPage() {
  const industries = [
    { name: 'Restaurants', icon: Utensils, desc: 'Kitchen printers, tips, tables, and tabs.' },
    { name: 'Bars', icon: Beer, desc: 'Fast tabs, age verification, and high-speed service.' },
    { name: 'Food Trucks', icon: Truck, desc: 'Mobile POS with cellular sync for on-the-go sales.' },
    { name: 'Retail Stores', icon: Package, desc: 'Barcode scanning, inventory, and categories.' },
    { name: 'Cafes', icon: Coffee, desc: 'Quick-pay, loyalty points, and simple modifiers.' },
    { name: 'Pizzerias', icon: Utensils, desc: 'Delivery tracking and specific topping mods.' },
    { name: 'Donut Shops', icon: Coffee, desc: 'Fast morning checkout and bulk order logic.' },
    { name: 'Small Businesses', icon: Building2, desc: 'Simple tools to grow and track shop profit.' },
    { name: 'Dispensaries', icon: Scale, desc: 'Inventory visibility and careful payment consulting.' },
    { name: 'Service Businesses', icon: Scissors, desc: 'Staff tracking, history, and booking links.' }
  ];

  const commonProblems = [
    "Slow Checkout Processes", "Confusing Financial Reports", "Inventory Shrinkage/Loss",
    "High Processing Fees", "Outdated Hardware", "Poor Local Support",
    "Staff Training Friction", "Printer/Terminal Issues", "Cash Drawer Shortages",
    "Untracked Refunds & Voids", "Merchant Statement Confusion", "Weak Employee Permissions"
  ];

  const testimonials = [
    { name: "Marisol M.", loc: "Nairobi, KE", text: "Great service, great Product. Simon is the man! If you need a POS reach out to them." },
    { name: "Lori Vavak", loc: "Kiambu, KE", text: "One of the best customer services. The team is amazing, patient, and available at all hours." },
    { name: "Mickey Nichols", loc: "Mombasa, KE", text: "Been with them for years. Reliable for our bar system and always willing to troubleshoot." },
    { name: "Sam H.", loc: "Nakuru, KE", text: "Jeff (the owner) will call and take care of issues even on weekends. Top tier support." }
  ];

  return (
    <div className="space-y-0 overflow-x-hidden selection:bg-[#eab308] selection:text-black">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 lg:pt-24 lg:pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left-4 duration-1000">
                <div className="inline-flex items-center gap-2 bg-[#eab308]/10 text-[#eab308] px-4 py-1.5 rounded-full border border-[#eab308]/20 shadow-sm mx-auto lg:mx-0">
                    <Star className="h-3 w-3 fill-[#eab308]" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black">Point of Sale Systems & Payment Processing</span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-black">
                    Smarter POS for <br />
                    <span className="text-[#eab308]">Nairobi Businesses.</span>
                </h1>
                <p className="text-sm sm:text-lg text-muted-foreground font-bold uppercase tracking-tight max-w-lg leading-tight mx-auto lg:mx-0">
                    Lower your processing fees. Get real local support. <br className="hidden sm:block" />
                    Run your business faster with Shop Manager.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4 px-4 sm:px-0">
                    <Button asChild className="h-16 px-12 font-black uppercase tracking-widest bg-black text-white hover:bg-black/90 rounded-2xl shadow-2xl active:scale-95 transition-all">
                        <Link href="/support/contact">Book a Demo</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-16 px-12 font-black uppercase tracking-widest border-2 border-black/10 rounded-2xl bg-white hover:bg-muted/50 active:scale-95 transition-all">
                        <Link href="/signup">Try for Free</Link>
                    </Button>
                </div>
            </div>
            
            <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-300">
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#eab308]/20 to-transparent rounded-full blur-3xl opacity-30" />
                <Card className="relative border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-muted/20 p-2 ring-1 ring-black/5">
                    <img src="/ChatGPT Image Aug 7, 2026, 10_09_14 PM.png" alt="POS Console" className="rounded-[2rem] w-full h-auto" />
                </Card>
            </div>
        </div>
      </section>

      {/* INDUSTRIES GRID */}
      <section className="py-20 bg-muted/10 border-y border-black/5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Industries We Serve</h2>
                <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto uppercase">Different businesses need different POS workflows. We specialize in tailoring our node logic to your specific operation.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {industries.map((ind) => (
                    <Card key={ind.name} className="border-none ring-1 ring-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden group">
                        <CardHeader className="p-6 text-center space-y-3">
                            <div className="bg-black p-3 rounded-2xl w-fit mx-auto group-hover:bg-[#eab308] transition-colors">
                                <ind.icon className="h-6 w-6 text-[#eab308] group-hover:text-black" />
                            </div>
                            <CardTitle className="text-sm font-black uppercase tracking-tight">{ind.name}</CardTitle>
                            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{ind.desc}</p>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* STRATEGIC REVIEW SECTION */}
      <section className="py-24 bg-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <div className="space-y-4">
                    <Badge className="bg-[#eab308] text-black font-black uppercase text-[10px] px-3 h-6">Review First Approach</Badge>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-[0.95]">Start with a Review <br /> before making a change.</h2>
                </div>
                <p className="text-sm sm:text-lg text-muted-foreground font-medium leading-relaxed uppercase">
                    Not every business needs to replace its POS system right away. Sometimes the better first step is reviewing your current setup, payment processing, merchant statements, and inventory tools.
                </p>
                <div className="p-6 bg-muted/30 rounded-3xl border-2 border-dashed border-black/5 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary p-2 rounded-lg mt-1"><FileSearch className="h-4 w-4 text-white" /></div>
                        <div>
                            <p className="text-xs font-black uppercase">Identify Leakage</p>
                            <p className="text-[11px] text-muted-foreground font-bold mt-1">A review helps identify what is working, what may be costing money, and what options make sense before making a disruptive change.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">Common Problems We Solve</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {commonProblems.map((prob, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-black/5 group hover:bg-white hover:shadow-lg transition-all">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e] shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-tight opacity-70 group-hover:opacity-100">{prob}</span>
                            </div>
                        ))}
                    </div>
                </div>
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
                        <Badge className="bg-[#eab308] text-black font-black uppercase text-[10px] px-3 h-6">East African Operations</Badge>
                        <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none">Local POS Support <br /> for Kenyan Shops.</h2>
                    </div>
                    <p className="text-base sm:text-xl text-white/50 font-medium leading-relaxed uppercase">
                        Local businesses need support that understands how they operate. From Nairobi and Kiambu to Nakuru and Mombasa, owners need systems that are installed correctly and supported after the sale.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-3xl font-black text-[#eab308]">24/7</p>
                            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Global Cloud Sync</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-black text-[#eab308]">100%</p>
                            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Local Voice Support</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/5 p-8 sm:p-12 rounded-[3rem] border border-white/10 space-y-8 shadow-2xl">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black uppercase tracking-tight">Reduce Your Fees</h3>
                        <p className="text-sm text-white/60 font-medium leading-relaxed uppercase">Most businesses pay between 2.5% – 3.5% per transaction. We review your setup and work to lower your costs. Many businesses can reduce their fees WITHOUT switching providers.</p>
                    </div>
                    <Button asChild className="h-16 px-10 w-full font-black uppercase tracking-widest bg-[#eab308] text-black hover:bg-[#eab308]/90 rounded-2xl shadow-xl transition-all">
                        <Link href="/support/contact">Get A Statement Review</Link>
                    </Button>
                </div>
            </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Voice of the Customer</h2>
                <p className="text-sm text-muted-foreground uppercase font-black tracking-widest">Our customers report better margins and fewer headaches.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {testimonials.map((t, i) => (
                    <Card key={i} className="border-none ring-1 ring-black/5 shadow-xl rounded-3xl p-8 space-y-4 bg-muted/5">
                        <div className="flex gap-0.5"><Star className="h-3 w-3 fill-[#eab308] text-[#eab308]" /> <Star className="h-3 w-3 fill-[#eab308] text-[#eab308]" /> <Star className="h-3 w-3 fill-[#eab308] text-[#eab308]" /> <Star className="h-3 w-3 fill-[#eab308] text-[#eab308]" /> <Star className="h-3 w-3 fill-[#eab308] text-[#eab308]" /></div>
                        <p className="text-xs font-medium leading-relaxed italic text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
                        <div className="pt-4 border-t border-black/5">
                            <p className="text-xs font-black uppercase">{t.name}</p>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t.loc}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* CTA / HOURS */}
      <section className="py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto p-12 sm:p-24 bg-[#1a1a1a] rounded-[40px] sm:rounded-[60px] text-center space-y-12 relative overflow-hidden shadow-2xl border-b-8 border-b-[#eab308]">
             <div className="relative z-10 space-y-10">
                <div className="space-y-4">
                    <h2 className="text-4xl sm:text-7xl font-black uppercase tracking-tighter text-white leading-none">
                        Ready to <span className="text-[#eab308]">Scale?</span>
                    </h2>
                    <p className="text-white/40 font-medium text-base sm:text-lg max-w-2xl mx-auto uppercase">Join thousands of Kenyan business owners who are optimizing their checkout speed and data flow.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/60">
                    <div className="space-y-2">
                        <Clock className="h-6 w-6 text-[#eab308] mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Office Hours</p>
                        <p className="text-xs font-bold text-white uppercase">Mon-Fri: 8AM - 5PM</p>
                    </div>
                    <div className="space-y-2">
                        <Phone className="h-6 w-6 text-[#eab308] mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Support Line</p>
                        <p className="text-xs font-bold text-white uppercase">+254 758 673 616</p>
                    </div>
                    <div className="space-y-2">
                        <Mail className="h-6 w-6 text-[#eab308] mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Official Channel</p>
                        <p className="text-xs font-bold text-white uppercase truncate">info@simonstyles.co.ke</p>
                    </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="h-16 px-12 font-black uppercase tracking-widest shadow-2xl bg-[#eab308] text-black hover:bg-[#eab308]/90 rounded-2xl active:scale-95 transition-all">
                        <Link href="/signup">Start Free Trial</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 px-12 font-black uppercase tracking-widest border-2 border-white/20 text-white hover:bg-white/5 rounded-2xl active:scale-95 transition-all">
                        <Link href="/support/contact">Connect with Advisory</Link>
                    </Button>
                </div>
             </div>
        </div>
      </section>
    </div>
  );
}
