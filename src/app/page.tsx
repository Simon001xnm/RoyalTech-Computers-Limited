'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Users, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * @fileOverview Standalone Home (Fresh Start)
 * Minimal entry point for a new workspace node.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="text-center py-20 space-y-6">
        <div className="bg-primary w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl ring-8 ring-primary/10">
          <Zap className="h-10 w-10 text-white fill-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
            Node Initialized
          </h1>
          <p className="text-muted-foreground font-medium text-lg">Your standalone business suite is ready for configuration.</p>
        </div>
        <div className="flex justify-center gap-4">
           <Badge variant="outline" className="h-8 px-4 font-black uppercase tracking-widest bg-green-50 text-green-700 border-green-200">
             <ShieldCheck className="h-3 w-3 mr-2" /> Encrypted Node
           </Badge>
           <Badge variant="outline" className="h-8 px-4 font-black uppercase tracking-widest bg-blue-50 text-blue-700 border-blue-200">
             <Users className="h-3 w-3 mr-2" /> Team Ready
           </Badge>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
        <Card className="border-none shadow-xl ring-1 ring-black/5 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight">Configuration</CardTitle>
            <CardDescription>Setup your shop profiles and business logic.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            All previous data and modules have been purged. You can now visit your settings to re-configure your business identity and staff permissions.
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-xl ring-1 ring-black/5 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight">Access Control</CardTitle>
            <CardDescription>Multi-user management is active.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            This node is strictly isolated. You can invite your team members through the Staff module to begin collaborating in this fresh workspace.
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center">
          <p className="text-[10px] text-muted-foreground tracking-[0.4em] uppercase opacity-40">
             Standalone Business Suite &bull; Clean Slate Node &bull; Secured
          </p>
      </div>
    </div>
  );
}
