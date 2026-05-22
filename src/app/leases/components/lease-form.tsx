
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Lease, Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Info } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import * as React from "react";
import { SignaturePad } from "@/components/ui/signature-pad";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const leaseFormSchema = z.object({
  clientType: z.enum(["Individual", "Corporate"]),
  customerId: z.string().min(1, "Customer is required."),
  laptopModel: z.string().min(1, "Laptop model is required."),
  serialNumber: z.string().min(1, "Serial number is required."),
  startDate: z.date({ required_error: "Start date is required." }),
  duration: z.coerce.number().min(1, "Duration is required."),
  durationUnit: z.enum(["Day", "Week", "Month", "Year"]),
  endDate: z.date({ required_error: "End date is required." }),
  monthlyPayment: z.coerce.number().min(0, "Rental rate must be positive."),
  paymentStatus: z.enum(["Paid", "Pending", "Overdue"]),
  status: z.enum(["Active", "Expired", "Terminated", "Upcoming"]),
  signature: z.string().optional(),
  
  isStudent: z.boolean().default(false),
  nationalId: z.string().optional(),
  guarantorId: z.string().optional(),
  studentId: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  businessPermit: z.string().optional(),
  cr12Reference: z.string().optional(),
  directorId: z.string().optional(),
  contactPerson: z.string().optional(),
});

type LeaseFormValues = z.infer<typeof leaseFormSchema>;

interface LeaseFormProps {
  lease?: Lease | null;
  customers: Pick<Customer, 'id' | 'name'>[];
  onSubmit: (data: LeaseFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LeaseForm({ 
  lease, 
  customers = [], 
  onSubmit, 
  onCancel, 
  isLoading 
}: LeaseFormProps) {
  const defaultValues: Partial<LeaseFormValues> = lease
    ? { 
        ...lease, 
        startDate: new Date(lease.startDate), 
        endDate: new Date(lease.endDate),
        serialNumber: lease.serialNumber || "",
        nationalId: lease.verification?.nationalId,
        guarantorId: lease.verification?.guarantorId,
        studentId: lease.verification?.studentId,
        parentName: lease.verification?.parentName,
        parentPhone: lease.verification?.parentPhone,
        businessPermit: lease.verification?.businessPermit,
        cr12Reference: lease.verification?.cr12Reference,
        directorId: lease.verification?.directorId,
        contactPerson: lease.verification?.contactPerson,
      }
    : {
        clientType: "Individual",
        duration: 1,
        durationUnit: "Day",
        startDate: new Date(),
        endDate: addDays(new Date(), 1),
        paymentStatus: "Pending",
        status: "Upcoming",
        signature: "",
        isStudent: false,
        laptopModel: "",
        serialNumber: "",
      };

  const form = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseFormSchema),
    defaultValues,
  });

  const clientType = form.watch("clientType");
  const isStudent = form.watch("isStudent");
  const startDate = form.watch("startDate");
  const duration = form.watch("duration");
  const durationUnit = form.watch("durationUnit");

  React.useEffect(() => {
    if (startDate && duration) {
        let newEndDate = new Date(startDate);
        if (durationUnit === "Day") newEndDate = addDays(startDate, duration);
        if (durationUnit === "Week") newEndDate = addWeeks(startDate, duration);
        if (durationUnit === "Month") newEndDate = addMonths(startDate, duration);
        if (durationUnit === "Year") newEndDate = addYears(startDate, duration);
        form.setValue("endDate", newEndDate);
    }
  }, [startDate, duration, durationUnit, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contract Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="clientType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Agreement Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Individual">Individual Agreement</SelectItem>
                            <SelectItem value="Corporate">Corporate Agreement</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Client Account</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Select client" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </section>

        <Separator />

        <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Info className="h-4 w-4" />
                {clientType} Verification Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/30 rounded-2xl border">
                {clientType === 'Individual' ? (
                    <>
                        <FormField control={form.control} name="nationalId" render={({ field }) => (
                            <FormItem><FormLabel>National ID Number *</FormLabel><FormControl><Input {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="guarantorId" render={({ field }) => (
                            <FormItem><FormLabel>Guarantor/Witness ID *</FormLabel><FormControl><Input {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="md:col-span-2 space-y-4">
                            <FormField control={form.control} name="isStudent" render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-4 bg-background rounded-xl border">
                                    <div className="space-y-0.5"><FormLabel>Student Lease</FormLabel></div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}/>
                            {isStudent && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="studentId" render={({ field }) => (
                                        <FormItem><FormLabel>Student ID</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="parentName" render={({ field }) => (
                                        <FormItem><FormLabel>Guardian Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="parentPhone" render={({ field }) => (
                                        <FormItem><FormLabel>Guardian Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )}/>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <FormField control={form.control} name="businessPermit" render={({ field }) => (
                            <FormItem><FormLabel>Business Permit No. *</FormLabel><FormControl><Input {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="cr12Reference" render={({ field }) => (
                            <FormItem><FormLabel>CR12 Reference *</FormLabel><FormControl><Input {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="directorId" render={({ field }) => (
                            <FormItem><FormLabel>Authorized Director ID *</FormLabel><FormControl><Input {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="contactPerson" render={({ field }) => (
                            <FormItem><FormLabel>Liaison Person</FormLabel><FormControl><Input {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </>
                )}
            </div>
        </section>

        <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Lease Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="laptopModel" render={({ field }) => (
                    <FormItem><FormLabel>Laptop Model/Name</FormLabel><FormControl><Input {...field} className="h-11" placeholder="e.g. HP EliteBook 840 G5" /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="serialNumber" render={({ field }) => (
                    <FormItem><FormLabel>Serial Number</FormLabel><FormControl><Input {...field} className="h-11" placeholder="Enter S/N" /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="monthlyPayment" render={({ field }) => (
                    <FormItem><FormLabel>Rental Rate (KES)</FormLabel><FormControl><Input type="number" {...field} className="h-11 font-bold" /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="duration" render={({ field }) => (
                        <FormItem><FormLabel>Duration</FormLabel><FormControl><Input type="number" {...field} className="h-11" /></FormControl></FormItem>
                    )}/>
                    <FormField control={form.control} name="durationUnit" render={({ field }) => (
                        <FormItem><FormLabel>Unit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Day">Days</SelectItem><SelectItem value="Week">Weeks</SelectItem>
                                    <SelectItem value="Month">Months</SelectItem><SelectItem value="Year">Years</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}/>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Commencement Date</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal h-11", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                        </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                    </FormItem>
                )}/>
                <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Expiry Date (Auto)</FormLabel>
                        <div className="h-11 border rounded-md flex items-center px-3 bg-muted/50 font-bold">{field.value ? format(field.value, "PPP") : "--"}</div>
                    </FormItem>
                )}/>
            </div>
        </section>

        <section className="space-y-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Digital Authorization</h3>
             <FormField control={form.control} name="signature" render={({ field }) => (
                <FormItem><FormControl><SignaturePad onSave={field.onChange} defaultValue={field.value} label="Lessee Legal Signature" /></FormControl><FormMessage /></FormItem>
             )}/>
        </section>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-12 px-6">Cancel</Button>
          <Button type="submit" disabled={isLoading} className="h-12 px-10 font-black uppercase tracking-widest shadow-lg">{lease ? "Update Lease" : "Execute Agreement"}</Button>
        </div>
      </form>
    </Form>
  );
}
