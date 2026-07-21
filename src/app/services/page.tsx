"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Calendar, User, Clock, CheckCircle2, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ServicesModule() {
  const appointments = [
    { id: 1, customer: "John Doe", service: "Executive Haircut", time: "10:00 AM", status: "Arrived" },
    { id: 2, customer: "Sarah Smith", service: "Full Manicure", time: "11:30 AM", status: "Upcoming" },
    { id: 3, customer: "Mike Ross", service: "Beard Trim", time: "01:00 PM", status: "Upcoming" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Appointments & Bookings" 
        description="Manage service schedules and staff availability for your salon or service shop."
        actionLabel="New Booking"
        onAction={() => {}}
        ActionIcon={PlusCircle}
      />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Daily Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-3xl font-black text-primary">12</div>
                  <p className="text-[10px] text-primary/60 font-bold mt-1 uppercase">Today's Schedule</p>
              </CardContent>
          </Card>
          <Card className="border-none ring-1 ring-black/5 shadow-sm">
              <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Staff</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-3xl font-black">4</div>
                  <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">On Duty</p>
              </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-green-700">Daily Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-3xl font-black text-green-700">KES 8,400</div>
                  <p className="text-[10px] text-green-600/70 font-bold mt-1 uppercase">Completed Services</p>
              </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl ring-1 ring-black/5">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Today's Queue
                </CardTitle>
                <Badge variant="outline" className="text-[8px] font-black">LIVE</Badge>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {appointments.map(app => (
                        <div key={app.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-muted p-2.5 rounded-full">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm uppercase">{app.customer}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">{app.service}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs font-black">{app.time}</p>
                                    <Badge variant={app.status === 'Arrived' ? 'default' : 'outline'} className="text-[7px] font-black uppercase h-4">
                                        {app.status}
                                    </Badge>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <CheckCircle2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-xl ring-1 ring-black/5">
             <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-sm font-black uppercase">Staff Availability</CardTitle>
            </CardHeader>
            <CardContent className="p-12 text-center opacity-20">
                <Scissors className="h-12 w-12 mx-auto mb-4" />
                <p className="font-bold text-[10px] uppercase">Roster node initializing...</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
