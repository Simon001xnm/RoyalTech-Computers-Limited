"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Asset } from "@/types";

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
import { CalendarIcon, DollarSign, Package } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const inventoryFormSchema = z.object({
  model: z.string().min(2, "Model must be at least 2 characters."),
  serialNumber: z.string().min(5, "Serial number must be at least 5 characters."),
  purchaseDate: z.date({ required_error: "Date is required." }),
  status: z.enum(["Available", "Leased", "Repair", "Sold", "With Reseller"]),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
  sellingPrice: z.coerce.number().min(0, "Selling price is required."),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

interface InventoryFormProps {
  laptop?: Asset | null;
  onSubmit: (data: InventoryFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LaptopForm({ laptop, onSubmit, onCancel, isLoading }: InventoryFormProps) {
  const defaultValues: Partial<InventoryFormValues> = laptop
    ? {
        ...laptop,
        purchaseDate: laptop.purchaseDate ? new Date(laptop.purchaseDate) : new Date(),
        sellingPrice: laptop.sellingPrice || 0,
      }
    : {
        model: "",
        serialNumber: "",
        status: "Available",
        quantity: 1,
        sellingPrice: 0,
        purchaseDate: new Date(),
      };

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: InventoryFormValues) => {
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
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., C02X1234J1GJ" {...field} />
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
                <FormLabel>Registration Date</FormLabel>
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
                <FormLabel>Status</FormLabel>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Stock Quantity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 10" {...field} />
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
                <FormLabel className="text-primary font-bold">Selling Price (Ksh)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" step="0.01" placeholder="0.00" className="pl-9 font-black" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-12 px-6">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="h-12 px-10 font-black uppercase tracking-widest shadow-lg">
            {isLoading ? "Syncing..." : (laptop ? "Update Item" : "Save to Inventory")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
