'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, ReceiptText } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { User } from 'firebase/auth';
import { useSaaS } from '@/components/saas/saas-provider';
import { useState } from 'react';

const expenseSchema = z.object({
  date: z.date(),
  category: z.string().min(2, "Category is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  notes: z.string().optional(),
});

interface TransactionFormProps {
  user: User | null;
  onFinished: () => void;
}

export function TransactionForm({ user, onFinished }: TransactionFormProps) {
  const { toast } = useToast();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { 
        date: new Date(), 
        category: '', 
        amount: 0, 
        notes: '' 
    },
  });

  const handleSubmit = async (data: z.infer<typeof expenseSchema>) => {
    if (!user || !tenant) return;
    setIsSubmitting(true);
    
    const colRef = collection(firestore, 'expenses');

    const docData = {
      ...data,
      tenantId: tenant.id,
      date: data.date.toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: { uid: user.uid, name: user.displayName || user.email },
    };

    try {
        addDocumentNonBlocking(colRef, docData);
        toast({ title: `Expense Recorded Successfully` });
        onFinished();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const categories = [
    "Salaries & Wages",
    "Rent & Utilities",
    "Marketing & Ads",
    "Software & Tech",
    "Office Supplies",
    "Travel & Logistics",
    "Maintenance",
    "Other Operating Costs"
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase">Amount (KES) *</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} className="h-12 text-lg font-black border-red-200 ring-red-50" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}/>

            <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] font-black uppercase mb-2">Transaction Date *</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("h-12 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}/>
        </div>

        <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
                <FormLabel className="text-[10px] font-black uppercase">Expense Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger className="h-12 font-bold">
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )}/>

        <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
                <FormLabel className="text-[10px] font-black uppercase">Additional Details</FormLabel>
                <FormControl>
                    <Textarea placeholder="Explain what this payment was for..." {...field} className="bg-muted/5 min-h-[100px]" />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}/>

        <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onFinished} className="h-12 px-6 font-bold">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="h-12 px-10 font-black uppercase tracking-widest shadow-xl bg-red-600 hover:bg-red-700 text-white">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><ReceiptText className="mr-2 h-4 w-4" /> Record Payment</>}
            </Button>
        </div>
      </form>
    </Form>
  );
}
