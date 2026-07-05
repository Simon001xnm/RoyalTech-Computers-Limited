'use client';

import React from 'react';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
  return (
    <MarketingWrapper>
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-12">
            <div className="space-y-4">
                <Badge className="bg-primary text-white uppercase font-black text-[10px] px-4">Support</Badge>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight">Talk to us</h1>
                <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                    Our team is here to help you with anything from technical setup to business strategy.
                </p>
            </div>
            
            <div className="space-y-8">
                <div className="flex gap-4">
                    <div className="bg-primary/5 p-3 rounded-xl"><Mail className="h-6 w-6 text-primary" /></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Email</p><p className="text-lg font-bold">support@businesshub.co.ke</p></div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-primary/5 p-3 rounded-xl"><Phone className="h-6 w-6 text-primary" /></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Phone</p><p className="text-lg font-bold">+254 700 000 000</p></div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-primary/5 p-3 rounded-xl"><MapPin className="h-6 w-6 text-primary" /></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Office</p><p className="text-lg font-bold">Nairobi, Kenya</p></div>
                </div>
            </div>
          </div>

          <div className="bg-muted/30 p-10 rounded-[48px] border border-black/5 shadow-sm">
            <form className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Your Name</Label>
                    <Input placeholder="John Doe" className="h-12" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Work Email</Label>
                    <Input type="email" placeholder="john@company.com" className="h-12" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Message</Label>
                    <Textarea placeholder="How can we help?" rows={6} className="bg-white" />
                </div>
                <Button className="w-full h-14 font-black uppercase tracking-widest text-lg shadow-xl">Send Message</Button>
            </form>
          </div>
        </div>
      </section>
    </MarketingWrapper>
  );
}
