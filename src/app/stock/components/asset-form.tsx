
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
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const assetFormSchema = z.object({
  model: z.string().min(2, "Model must be at least 2 characters."),
  serialNumber: z.string().min(5, "Serial number must be at least 5 characters."),
  purchaseDate: z.date({ required_error: "Acquisition date is required." }),
  status: z.enum(["Available", "Leased", "Repair", "Sold", "With Reseller"]),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
  ram: z.string().optional(),
  storage: z.string().optional(),
  processor: z.string().optional(),
  purchasePrice: z.coerce.number().optional(),
  leasePrice: z.coerce.number().optional(),
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
        ram: asset.specifications?.ram,
        storage: asset.specifications?.storage,
        processor: asset.specifications?.processor,
      }
    : {
        model: "",
        serialNumber: "",
        status: "Available",
        quantity: 1,
        purchasePrice: undefined,
        leasePrice: undefined,
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Model/Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., iPhone 15 Pro, HP EliteBook" {...field} />
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
                <FormLabel>Serial Number / IMEI</FormLabel>
                <FormControl>
                  <Input placeholder="Unique identifier for the asset" {...field} />
                </FormControl>
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
                <FormLabel>Date Acquired</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
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
                <FormLabel>Current Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Leased">Leased</SelectItem>
                    <SelectItem value="Repair">Under Repair</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="With Reseller">With Reseller</SelectItem>
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
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormLabel className="text-lg font-semibold">Technical Specifications (Optional)</FormLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-md">
           <FormField
            control={form.control}
            name="ram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Memory (RAM)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 8GB, 16GB" {...field} />
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
                  <Input placeholder="e.g., 256GB SSD, 1TB" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="processor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processor/Chipset</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Apple A17, Intel i7" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <FormLabel className="text-lg font-semibold">Financials (Optional)</FormLabel>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md">
           <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Amount spent to acquire" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="leasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Lease Rate</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Recurring monthly income" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>


        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : (asset ? "Save Changes" : "Register Asset")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
