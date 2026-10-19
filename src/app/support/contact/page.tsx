'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
  return (
    <MarketingWrapper>
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-10">
            <div className="space-y-3">
                <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Get Help</Badge>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">Talk to our team</h1>
                <p className="text-base text-muted-foreground font-medium leading-relaxed">
                    We are here to help you get your shop started or answer any questions you have about our tools.
                </p>
            </div>
            
            <div className="space-y-6">
                <div className="flex gap-3">
                    <div className="bg-primary/5 p-2 rounded-lg"><Mail className="h-5 w-5 text-primary" /></div>
                    <div>
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Email Us</p>
                        <p className="text-sm font-bold">info@simonstyles.co.ke</p>
                        <p className="text-xs text-muted-foreground">simonwanjiru224@gmail.com</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="bg-primary/5 p-2 rounded-lg"><Phone className="h-5 w-5 text-primary" /></div>
                    <div><p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Call or WhatsApp</p><p className="text-sm font-bold">+254 758 673 616</p></div>
                </div>
                <div className="flex gap-3">
                    <div className="bg-primary/5 p-2 rounded-lg"><MapPin className="h-5 w-5 text-primary" /></div>
                    <div><p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Office</p><p className="text-sm font-bold">Nairobi, Kenya</p></div>
                </div>
            </div>
          </div>

          <div className="bg-muted/30 p-8 rounded-3xl border border-black/5 shadow-sm">
            <form className="space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest">Your Name</Label>
                    <Input placeholder="John Doe" className="h-10 text-xs" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest">Your Email</Label>
                    <Input type="email" placeholder="john@gmail.com" className="h-10 text-xs" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest">Message</Label>
                    <Textarea placeholder="How can we help your business?" rows={4} className="bg-white text-xs" />
                </div>
                <Button className="w-full h-12 font-black uppercase tracking-widest text-xs shadow-lg mt-2">Send My Message</Button>
            </form>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
