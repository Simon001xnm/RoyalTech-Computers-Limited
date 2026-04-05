"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Ticket, Customer, Lease } from "@/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ticketFormSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  description: z.string().optional(),
  customerId: z.string().min(1, "Customer is required."),
  leaseId: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["Open", "In Progress", "Closed"]),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  ticket?: Ticket | null;
  customers: Customer[];
  leases: (Lease & { assetSerialNumber?: string; assetModel?: string })[];
  onSubmit: (data: TicketFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TicketForm({ 
  ticket, 
  customers = [], 
  leases = [], 
  onSubmit, 
  onCancel, 
  isLoading 
}: TicketFormProps) {
  
  const defaultValues: Partial<TicketFormValues> = ticket
    ? ticket
    : {
        subject: "",
        description: "",
        priority: "Medium",
        status: "Open",
      };

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues,
  });

  const selectedCustomerId = form.watch("customerId");

  const customerLeases = useMemo(() => {
    if (!selectedCustomerId) return [];
    return leases.filter(l => l.customerId === selectedCustomerId);
  }, [selectedCustomerId, leases]);

  const handleSubmit = (data: TicketFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="leaseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Lease (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCustomerId || customerLeases.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedCustomerId ? "Select a customer first" : "Select a lease"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customerLeases.map(l => <SelectItem key={l.id} value={l.id}>{l.assetSerialNumber} ({l.assetModel})</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Device won't turn on" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the issue in detail..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
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
            {isLoading ? (ticket ? "Saving..." : "Creating...") : (ticket ? "Save Changes" : "Create Ticket")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
