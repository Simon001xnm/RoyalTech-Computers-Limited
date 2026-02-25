
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Reseller } from "@/types";

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

const resellerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(["Active", "Suspended"]),
});

type ResellerFormValues = z.infer<typeof resellerFormSchema>;

interface ResellerFormProps {
  reseller?: Reseller | null;
  onSubmit: (data: ResellerFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ResellerForm({ reseller, onSubmit, onCancel, isLoading }: ResellerFormProps) {
  const defaultValues: Partial<ResellerFormValues> = reseller
    ? reseller
    : {
        name: "",
        email: "",
        phone: "",
        company: "",
        status: "Active",
      };

  const form = useForm<ResellerFormValues>({
    resolver: zodResolver(resellerFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: ResellerFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Reseller Name</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., John's Electronics" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Company Name (Optional)</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., Questech Inc." {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                    <Input type="email" placeholder="e.g., contact@johnselectronics.com" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., +254 712 345 678" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
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
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (reseller ? "Saving..." : "Creating...") : (reseller ? "Save Changes" : "Create Reseller")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
