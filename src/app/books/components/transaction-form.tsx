
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
import { useFirestore } from '@/firebase/provider';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
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
  const firestore = useFirestore();
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
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const collectionRef = collection(firestore, type);
    
    // Create a clean data object
    const docData: { [key: string]: any } = {
      ...data,
      date: data.date.toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: { uid: user.uid, name: user.displayName || user.email },
    };

    // Remove any keys with an 'undefined' value before sending to Firestore
    Object.keys(docData).forEach(key => {
      if (docData[key] === undefined) {
        delete docData[key];
      }
    });

    await addDocumentNonBlocking(collectionRef, docData);
    toast({ title: `Transaction Recorded`, description: `A new ${type.slice(0, -1)} has been added.` });
    onFinished();
  };

  const renderDateField = (form: any, name: "date") => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Date</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
      )}
    />
  );
  
  return (
    <Tabs defaultValue="sale" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sale">Sale</TabsTrigger>
        <TabsTrigger value="expense">Expense</TabsTrigger>
      </TabsList>
      <TabsContent value="sale">
        <Form {...saleForm}>
          <form onSubmit={saleForm.handleSubmit((data) => handleSubmit(data, 'sales'))} className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              {renderDateField(saleForm, 'date')}
              <FormField control={saleForm.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            <FormField control={saleForm.control} name="paymentMethod" render={({ field }) => (
              <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Till">Till</SelectItem><SelectItem value="M-Pesa">M-Pesa</SelectItem><SelectItem value="Bank">Bank</SelectItem><SelectItem value="Paybill">Paybill</SelectItem><SelectItem value="Cash">Cash</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )}/>
             <FormField control={saleForm.control} name="cogs" render={({ field }) => (
                <FormItem><FormLabel>Cost of Goods Sold (Optional)</FormLabel><FormControl><Input type="number" placeholder="Cost for this specific sale" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            <FormField control={saleForm.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <Button type="submit">Record Sale</Button>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="expense">
         <Form {...expenseForm}>
          <form onSubmit={expenseForm.handleSubmit((data) => handleSubmit(data, 'expenses'))} className="space-y-4 p-4">
             <div className="grid grid-cols-2 gap-4">
                {renderDateField(expenseForm, 'date')}
                <FormField control={expenseForm.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
             </div>
             <FormField control={expenseForm.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Rent, Salaries, Utilities" {...field} /></FormControl><FormMessage /></FormItem>
             )}/>
             <FormField control={expenseForm.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <Button type="submit">Record Expense</Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
