
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Laptop } from "@/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const laptopFormSchema = z.object({
  model: z.string().min(2, "Model must be at least 2 characters."),
  serialNumber: z.string().min(5, "Serial number must be at least 5 characters."),
  purchaseDate: z.date({ required_error: "Purchase date is required." }),
  status: z.enum(["Available", "Leased", "Repair", "Sold", "With Reseller"]),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
  ram: z.string().optional(),
  storage: z.string().optional(),
  processor: z.string().optional(),
  purchasePrice: z.coerce.number().optional(),
  leasePrice: z.coerce.number().optional(),
});

type LaptopFormValues = z.infer<typeof laptopFormSchema>;

interface LaptopFormProps {
  laptop?: Laptop | null; // For editing
  onSubmit: (data: LaptopFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LaptopForm({ laptop, onSubmit, onCancel, isLoading }: LaptopFormProps) {
  const defaultValues: Partial<LaptopFormValues> = laptop
    ? {
        ...laptop,
        purchaseDate: new Date(laptop.purchaseDate),
        ram: laptop.specifications?.ram,
        storage: laptop.specifications?.storage,
        processor: laptop.specifications?.processor,
      }
    : {
        model: "",
        serialNumber: "",
        status: "Available",
        quantity: 1,
        purchasePrice: undefined,
        leasePrice: undefined,
      };

  const form = useForm<LaptopFormValues>({
    resolver: zodResolver(laptopFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: LaptopFormValues) => {
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
                <FormLabel>Model Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., MacBook Pro 16 M3" {...field} />
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
                <FormLabel>Purchase Date</FormLabel>
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
        
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormLabel className="text-lg font-semibold">Specifications (Optional)</FormLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-md">
           <FormField
            control={form.control}
            name="ram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RAM</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 16GB" {...field} />
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
                  <Input placeholder="e.g., 512GB SSD" {...field} />
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
                  <Input placeholder="e.g., Apple M3 Pro" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <FormLabel className="text-lg font-semibold">Pricing (Optional)</FormLabel>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md">
           <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price (Ksh)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 120000.00" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="leasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Lease Price (Ksh)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 7500.00" {...field} value={field.value ?? ''} />
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
            {isLoading ? (laptop ? "Saving..." : "Adding...") : (laptop ? "Save Changes" : "Add Laptop")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    