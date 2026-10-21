"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Asset, Company } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, CheckCircle2, Box, Tag, AlertTriangle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo } from "react";
import { useSaaS } from "@/components/saas/saas-provider";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from 'next/link';

const inventoryFormSchema = z.object({
  model: z.string().min(2, "Model must be at least 2 characters."),
  serialNumber: z.string().optional().default(""),
  purchaseDate: z.date({ required_error: "Date is required." }),
  status: z.enum(["Available", "Leased", "Repair", "Sold", "With Reseller"]),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
  purchasePrice: z.coerce.number().min(1, "Buying price is mandatory."),
  sellingPrice: z.coerce.number().min(0, "Selling price is required."),
  isSerialized: z.boolean().default(true),
  category: z.string().min(2, "Category is required."),
  subCategory: z.string().optional().default(""),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

interface InventoryFormProps {
  laptop?: Asset | null;
  onSubmit: (data: InventoryFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LaptopForm({ laptop, onSubmit, onCancel, isLoading }: InventoryFormProps) {
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  const companyRef = useMemoFirebase(() => tenant?.id ? doc(firestore, 'companies', tenant.id) : null, [firestore, tenant?.id]);
  const { data: company } = useDoc<Company>(companyRef);

  const defaultValues: Partial<InventoryFormValues> = laptop
    ? {
        ...laptop,
        purchaseDate: laptop.purchaseDate ? new Date(laptop.purchaseDate) : new Date(),
        purchasePrice: (laptop as any).purchasePrice || 0,
        sellingPrice: laptop.sellingPrice || 0,
        isSerialized: laptop.isSerialized ?? true,
        serialNumber: laptop.serialNumber || "",
        category: laptop.category || "",
        subCategory: laptop.subCategory || "",
      }
    : {
        model: "",
        serialNumber: "",
        status: "Available",
        quantity: 1,
        purchasePrice: 0,
        sellingPrice: 0,
        purchaseDate: new Date(),
        isSerialized: true,
        category: "",
        subCategory: "",
      };

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: defaultValues as any,
  });

  const isSerialized = form.watch("isSerialized");
  const selectedCategoryName = form.watch("category");

  useEffect(() => {
    if (isSerialized) {
      form.setValue("quantity", 1);
    }
  }, [isSerialized, form]);

  const subCategoryOptions = useMemo(() => {
      if (!company?.categories || !selectedCategoryName) return [];
      const cat = company.categories.find(c => c.name === selectedCategoryName);
      return cat?.subCategories || [];
  }, [company?.categories, selectedCategoryName]);

  const handleSubmit = (data: InventoryFormValues) => {
    if (data.isSerialized && (!data.serialNumber || data.serialNumber.length < 3)) {
      form.setError("serialNumber", { message: "Serial number is required for serialized items." });
      return;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <div className="space-y-0.5">
            <Label className="text-sm font-black uppercase tracking-tight">Serialized Item Tracking</Label>
            <p className="text-[10px] text-muted-foreground uppercase">Unique unit tracking vs Bulk stock</p>
          </div>
          <FormField
            control={form.control}
            name="isSerialized"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Model / Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., MacBook Pro 16" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number {isSerialized && "*"}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={isSerialized ? "Enter unique S/N" : "Optional for bulk"} 
                    {...field} 
                    disabled={!isSerialized && !field.value} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Category</FormLabel>
                  <Select onValueChange={(val) => { field.onChange(val); form.setValue("subCategory", ""); }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pick a group..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {company?.categories?.map((cat, i) => (
                            <SelectItem key={i} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                        {(!company?.categories || company.categories.length === 0) && (
                            <div className="p-4 text-center space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">No groups defined</p>
                                <Button asChild variant="link" size="sm" className="text-[10px] h-auto p-0"><Link href="/profile">Set Groups in Settings</Link></Button>
                            </div>
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategoryName}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={selectedCategoryName ? "Pick sub-group..." : "Select category first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {subCategoryOptions.map((sub, i) => (
                            <SelectItem key={i} value={sub}>{sub}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Registration Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal h-11",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inventory Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Available">Available for Sale</SelectItem>
                    <SelectItem value="Leased">On Lease</SelectItem>
                    <SelectItem value="Repair">Under Maintenance</SelectItem>
                    <SelectItem value="Sold">Sold Out</SelectItem>
                    <SelectItem value="With Reseller">With Partner</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g., 10" 
                    {...field} 
                    disabled={isSerialized} 
                    className="h-11 font-bold"
                  />
                </FormControl>
                {isSerialized && <p className="text-[9px] text-primary font-bold uppercase mt-1">Locked to 1 for Serialized items</p>}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-red-600 font-bold uppercase text-[10px]">Buying Price (Ksh) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" step="0.01" placeholder="0.00" className="pl-9 font-black h-11 border-red-200" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary font-bold uppercase text-[10px]">Selling Price (Ksh) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" step="0.01" placeholder="0.00" className="pl-9 font-black h-11 border-primary/20" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-12 px-6 font-bold">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="h-12 px-12 font-black uppercase tracking-widest shadow-xl">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            {laptop ? "Sync Changes" : "Commit to Shop"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
