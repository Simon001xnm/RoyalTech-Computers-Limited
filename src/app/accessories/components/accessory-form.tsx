
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Accessory } from "@/types";

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
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const accessoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  serialNumber: z.string().min(5, "Serial number must be at least 5 characters."),
  purchaseDate: z.date({ required_error: "Purchase date is required." }),
  status: z.enum(["Available", "Sold", "With Reseller"]),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
  purchasePrice: z.coerce.number().optional(),
  sellingPrice: z.coerce.number().positive("Selling price must be a positive number."),
});

type AccessoryFormValues = z.infer<typeof accessoryFormSchema>;

interface AccessoryFormProps {
  accessory?: Accessory | null;
  onSubmit: (data: AccessoryFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AccessoryForm({ accessory, onSubmit, onCancel, isLoading }: AccessoryFormProps) {
  const defaultValues: Partial<AccessoryFormValues> = accessory
    ? {
        ...accessory,
        purchaseDate: new Date(accessory.purchaseDate),
      }
    : {
        name: "",
        serialNumber: "",
        status: "Available",
        quantity: 1,
        purchasePrice: undefined,
        sellingPrice: undefined,
      };

  const form = useForm<AccessoryFormValues>({
    resolver: zodResolver(accessoryFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: AccessoryFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accessory Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Laptop Charger" {...field} />
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
                  <Input placeholder="e.g., CHRG12345" {...field} />
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
        
        <FormLabel className="text-lg font-semibold">Pricing</FormLabel>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md">
           <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price (Ksh) (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 2000.00" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price (Ksh)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 4999.00" {...field} value={field.value ?? ''} />
                </FormControl>
                 <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (accessory ? "Saving..." : "Adding...") : (accessory ? "Save Changes" : "Add Accessory")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
