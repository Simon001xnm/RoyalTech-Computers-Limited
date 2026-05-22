
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Asset } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const assetFormSchema = z.object({
  model: z.string().min(2, "Model name required."),
  serialNumber: z.string().min(3, "Serial number is mandatory and must be unique."),
  purchaseDate: z.date({ required_error: "Acquisition date is required." }),
  status: z.enum(["Available", "Leased", "Repair", "Sold", "With Reseller"]),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
  ram: z.string().optional(),
  storage: z.string().optional(),
  processor: z.string().optional(),
  purchasePrice: z.coerce.number().optional().nullable(),
  leasePrice: z.coerce.number().optional().nullable(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  asset?: Asset | null;
  onSubmit: (data: AssetFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssetForm({ asset, onSubmit, onCancel, isLoading }: AssetFormProps) {
  const defaultValues: Partial<AssetFormValues> = asset
    ? {
        ...asset,
        purchaseDate: new Date(asset.purchaseDate),
        ram: asset.specifications?.ram || "",
        storage: asset.specifications?.storage || "",
        processor: asset.specifications?.processor || "",
      }
    : {
        model: "",
        serialNumber: "",
        status: "Available",
        quantity: 1,
        ram: "",
        storage: "",
        processor: "",
        purchasePrice: null,
        leasePrice: null,
      };

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: AssetFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Model / Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., HP EliteBook 840 G5" {...field} />
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
                <FormLabel>Serial Number / IMEI *</FormLabel>
                <FormControl>
                  <Input placeholder="Must be unique" {...field} disabled={!!asset} />
                </FormControl>
                <FormDescription className="text-[10px]">Unique hardware identifier.</FormDescription>
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
                <FormLabel>Date Acquired *</FormLabel>
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
                          <span>Pick acquisition date</span>
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
                        date > new Date() || date < new Date("2000-01-01")
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
                <FormLabel>Current Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Available">Available for Lease/Sale</SelectItem>
                    <SelectItem value="Leased">Currently Leased</SelectItem>
                    <SelectItem value="Repair">In Repair Shop</SelectItem>
                    <SelectItem value="With Reseller">With Reseller Partner</SelectItem>
                    <SelectItem value="Sold">Permanently Sold</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity in Stock</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border rounded-2xl bg-muted/20">
            <FormField
                control={form.control}
                name="ram"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>RAM (Memory)</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., 16GB DDR4" {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="storage"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Storage</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., 512GB NVMe SSD" {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="processor"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Processor</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., Intel Core i7 8th Gen" {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
            </div>
        </div>
        
        <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Financial Valuation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-2xl bg-muted/20">
            <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Acquisition Cost (KES)</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" placeholder="Cost price" {...field} value={field.value ?? ''} />
                    </FormControl>
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="leasePrice"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Standard Daily Lease Rate (KES)</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" placeholder="Rental income per day" {...field} value={field.value ?? ''} />
                    </FormControl>
                </FormItem>
                )}
            />
            </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-11 px-6">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="h-11 px-10 font-black uppercase tracking-widest shadow-lg">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (asset ? "Save Changes" : "Confirm Registration")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
