"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Utensils, Timer, Coffee, CheckCircle2, ShoppingCart, Users, MoreHorizontal, ArrowUpRight, ChefHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HospitalityModule() {
  const tables = [
    { id: "T1", status: "Occupied", items: 4, timer: "12:40", amount: "2,400" },
    { id: "T2", status: "Available", items: 0, timer: "00:00", amount: "0" },
    { id: "T3", status: "Bill Ready", items: 8, timer: "45:10", amount: "7,800" },
    { id: "T4", status: "Occupied", items: 2, timer: "05:15", amount: "1,100" },
    { id: "T5", status: "Available", items: 0, timer: "00:00", amount: "0" },
    { id: "T6", status: "Available", items: 0, timer: "00:00", amount: "0" },
  ];

  return (
    <div className="space-y-6 md:space-y-10">
      <PageHeader 
        title="Hospitality Area" 
        description="Table management and kitchen order tracking for your shop."
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {tables.map(table => (
              <Card key={table.id} className="border-none ring-1 ring-black/5 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
                {table.status === 'Occupied' && <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse" />}
                {table.status === 'Bill Ready' && <div className="absolute top-0 left-0 w-full h-1 bg-orange-500" />}
                
                <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-2xl font-black tracking-tighter">{table.id}</span>
                        <Utensils className="h-4 w-4 opacity-10 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1">
                         <Badge variant={table.status === 'Available' ? 'secondary' : (table.status === 'Bill Ready' ? 'outline' : 'default')} className="text-[8px] font-black uppercase py-0 px-2 h-4 w-full justify-center border-none">
                            {table.status}
                         </Badge>
                         {table.items > 0 ? (
                             <p className="text-[10px] text-center font-black uppercase tracking-tight text-primary">KES {table.amount}</p>
                         ) : (
                            <p className="text-[10px] text-center font-bold text-muted-foreground opacity-40 uppercase">EMPTY</p>
                         )}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        <span className="text-[10px] font-black tabular-nums">{table.timer}</span>
                    </div>
                </CardContent>
              </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="border-none shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b p-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-lg shadow-sm">
                        <ChefHat className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">
                        Kitchen Display
                    </CardTitle>
                </div>
                <Badge className="bg-primary text-white font-black text-[9px] px-2 h-5">4 ACTIVE TICKETS</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-muted/30 rounded-2xl border-2 border-dashed flex items-center justify-between group hover:border-primary transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Table T3</p>
                            <span className="text-[8px] font-bold text-muted-foreground">&bull; 8 mins ago</span>
                        </div>
                        <p className="text-sm font-black uppercase leading-tight">2x Grilled Chicken Platter</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Extra spicy, No coleslaw</p>
                    </div>
                    <Button className="h-9 px-4 font-black uppercase text-[10px] tracking-widest shadow-lg">MARK READY</Button>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border flex items-center justify-between opacity-50 grayscale group">
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Table T1</p>
                        <p className="text-sm font-bold uppercase leading-tight">1x House Coffee (Black)</p>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-5">
                <div className="flex items-center gap-3">
                    <div className="bg-black p-2 rounded-lg shadow-sm">
                        <ShoppingCart className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Shop Info</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    <div className="p-5 flex items-center justify-between hover:bg-muted/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-muted p-2 rounded-xl">
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Average Table Turn</p>
                                <p className="text-lg font-black tracking-tighter">34 MINS</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black text-green-600 border-green-200">-12% IMPROVED</Badge>
                    </div>
                    <div className="p-5 flex items-center justify-between hover:bg-muted/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-muted p-2 rounded-xl">
                                <Coffee className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Top Selling Today</p>
                                <p className="text-lg font-black tracking-tighter uppercase">HOUSE COFFEE</p>
                            </div>
                        </div>
                        <p className="text-[10px] font-black opacity-40 uppercase">28 SOLD</p>
                    </div>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
