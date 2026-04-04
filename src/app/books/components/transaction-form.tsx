'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { db } from '@/db';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { User } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const saleSchema = z.object({
  date: z.date(),
  amount: z.coerce.number().positive("Amount must be positive."),
  paymentMethod: z.enum(['Till', 'M-Pesa', 'Bank', 'Paybill', 'Cash']),
  cogs: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

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

  const saleForm = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: { date: new Date(), amount: 0, paymentMethod: 'M-Pesa' },
  });
  
  const expenseForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: new Date(), category: '', amount: 0 },
  });

  const handleSubmit = async (data: any, type: 'sales' | 'expenses') => {
    if (!user) return;
    
    const docData: any = {
      ...data,
      id: crypto.randomUUID(),
      date: data.date.toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: { uid: user.uid, name: user.displayName || user.email },
    };

    try {
        if (type === 'sales') await db.sales.add(docData);
        else await db.expenses.add(docData);
        toast({ title: `Transaction Recorded Locally` });
        onFinished();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  return (
    <Tabs defaultValue="sale" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sale">Sale</TabsTrigger>
        <TabsTrigger value="expense">Expense</TabsTrigger>
      </TabsList>
      <TabsContent value="sale">
        <Form {...saleForm}>
          <form onSubmit={saleForm.handleSubmit((data) => handleSubmit(data, 'sales'))} className="space-y-4 p-4">
            <FormField control={saleForm.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={saleForm.control} name="paymentMethod" render={({ field }) => (
              <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Till">Till</SelectItem><SelectItem value="M-Pesa">M-Pesa</SelectItem><SelectItem value="Bank">Bank</SelectItem><SelectItem value="Paybill">Paybill</SelectItem><SelectItem value="Cash">Cash</SelectItem></SelectContent></Select></FormItem>
            )}/>
            <Button type="submit">Record Sale</Button>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="expense">
         <Form {...expenseForm}>
          <form onSubmit={expenseForm.handleSubmit((data) => handleSubmit(data, 'expenses'))} className="space-y-4 p-4">
             <FormField control={expenseForm.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
             )}/>
             <FormField control={expenseForm.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Rent, Salaries" {...field} /></FormControl><FormMessage /></FormItem>
             )}/>
            <Button type="submit">Record Expense</Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
