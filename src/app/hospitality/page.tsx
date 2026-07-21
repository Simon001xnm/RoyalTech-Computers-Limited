"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Timer, Coffee, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HospitalityModule() {
  const tables = [
    { id: "T1", status: "Occupied", items: 4, timer: "12:40" },
    { id: "T2", status: "Available", items: 0, timer: "00:00" },
    { id: "T3", status: "Bill Ready", items: 8, timer: "45:10" },
    { id: "T4", status: "Occupied", items: 2, timer: "05:15" },
    { id: "T5", status: "Available", items: 0, timer: "00:00" },
    { id: "T6", status: "Available", items: 0, timer: "00:00" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Hospitality Hub" 
        description="Table management and live kitchen order tracking."
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {tables.map(table => (
              <Card key={table.id} className="border-none ring-1 ring-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-black">{table.id}</span>
                        <Utensils className="h-4 w-4 opacity-20" />
                    </div>
                    <div className="space-y-1">
                         <Badge variant={table.status === 'Available' ? 'secondary' : 'default'} className="text-[8px] font-black uppercase py-0 px-2 h-4 w-full justify-center">
                            {table.status}
                         </Badge>
                         {table.items > 0 && <p className="text-[9px] text-center font-bold">{table.items} Items Ordered</p>}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        <span className="text-[10px] font-mono">{table.timer}</span>
                    </div>
                </CardContent>
              </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border-none shadow-xl ring-1 ring-black/5">
            <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-primary" />
                    Kitchen Display (KDS)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
                <div className="p-4 bg-muted/30 rounded-xl border flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Table T3</p>
                        <p className="text-sm font-bold">2x Grilled Chicken Platter</p>
                    </div>
                    <Badge className="bg-orange-500 text-white font-black text-[9px]">PENDING</Badge>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border flex items-center justify-between opacity-50">
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Table T1</p>
                        <p className="text-sm font-bold">1x House Coffee (Black)</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-xl ring-1 ring-black/5">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-xs font-black uppercase">Menu Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="p-12 text-center opacity-20">
                <p className="font-bold text-[10px] uppercase">Menu Editor Initializing...</p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
