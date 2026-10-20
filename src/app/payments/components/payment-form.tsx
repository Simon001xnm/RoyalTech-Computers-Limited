"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore } from '@/firebase';
import { useSaaS } from '@/components/saas/saas-provider';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { Loader2, DollarSign, ArrowDownLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  type: z.enum(['Payment', 'Credit Note']),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.enum(['Cash', 'M-Pesa', 'Bank', 'Card', 'Cheque', 'Paybill', 'Till', 'Credit']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

interface PaymentFormProps {
  customers: any[];
  onFinished: () => void;
}

export function PaymentForm({ customers, onFinished }: PaymentFormProps) {
  const { user } = useUser();
  const { tenant } = useSaaS();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      type: 'Payment',
      method: 'Cash',
      amount: 0,
    }
  });

  const selectedType = form.watch('type');

  const handleSubmit = async (values: z.infer<typeof paymentSchema>) => {
    if (!user || !tenant) return;
    setIsSubmitting(true);

    try {
        const customer = customers.find(c => c.id === values.customerId);
        const timestamp = new Date().toISOString();
        
        // 1. Record the Payment/Credit Note Log
        await addDoc(collection(firestore, 'payments'), {
            ...values,
            tenantId: tenant.id,
            customerName: customer?.name || 'Unknown',
            date: timestamp,
            createdAt: timestamp,
            createdBy: { uid: user.uid, name: user.displayName || user.email }
        });

        // 2. Adjust account balances if applicable
        // This logic finds the oldest unpaid sale for the customer and applies the payment
        if (values.type === 'Payment') {
            const salesRef = collection(firestore, 'sales_transactions');
            const q = query(
                salesRef, 
                where('tenantId', '==', tenant.id), 
                where('customerId', '==', values.customerId),
                where('status', 'in', ['Credit', 'Partial'])
            );
            const snap = await getDocs(q);
            
            let remainingMoney = values.amount;
            const unpaidSales = snap.docs
                .map(d => ({ ...d.data(), id: d.id }))
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

            for (const sale of unpaidSales) {
                if (remainingMoney <= 0) break;
                const bal = Number((sale as any).balance) || 0;
                const deduct = Math.min(bal, remainingMoney);
                
                await updateDoc(doc(firestore, 'sales_transactions', sale.id), {
                    balance: bal - deduct,
                    amountPaid: (Number((sale as any).amountPaid) || 0) + deduct,
                    status: (bal - deduct) <= 0 ? 'Paid' : 'Partial',
                    updatedAt: timestamp
                });
                remainingMoney -= deduct;
            }
        }

        toast({ title: `${values.type} Recorded Successfully` });
        onFinished();
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Process Failed", description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase">Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className={cn(
                                "h-11 font-bold",
                                selectedType === 'Credit Note' ? "border-red-200 bg-red-50 text-red-700" : "border-primary"
                            )}>
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Payment">Payment Received</SelectItem>
                            <SelectItem value="Credit Note">Credit Note (Refund)</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )}/>
            <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase">Client Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Select..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </FormItem>
            )}/>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase">Amount (KES)</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" {...field} className="h-12 text-xl font-black pl-9" />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="method" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase">Payment Channel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="M-Pesa">M-Pesa (Direct)</SelectItem>
                            <SelectItem value="Paybill">Paybill Transfer</SelectItem>
                            <SelectItem value="Till">Buy Goods (Till)</SelectItem>
                            <SelectItem value="Bank">Bank Deposit/Transfer</SelectItem>
                            <SelectItem value="Cheque">Physical Cheque</SelectItem>
                            <SelectItem value="Credit">Credit / AR Offset</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )}/>
        </div>

        <FormField control={form.control} name="reference" render={({ field }) => (
            <FormItem>
                <FormLabel className="text-[10px] font-black uppercase">Reference Number / Tracking ID</FormLabel>
                <FormControl>
                    <Input {...field} placeholder="e.g. QXJ5... or Bank Code" className="h-11 font-mono uppercase text-xs" />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}/>

        <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
                <FormLabel className="text-[10px] font-black uppercase">Internal Audit Notes</FormLabel>
                <FormControl>
                    <Textarea {...field} placeholder="Reason for payment or credit note details..." className="bg-muted/5" />
                </FormControl>
            </FormItem>
        )}/>

        <div className="bg-primary/5 p-4 rounded-xl border flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                Recording this entry will permanently update the client's financial ledger and generate an internal audit log.
            </p>
        </div>

        <DialogFooter className="gap-2 border-t pt-6">
            <Button type="button" variant="outline" onClick={onFinished} className="h-12 px-6 font-bold">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className={cn(
                "h-12 px-10 font-black uppercase tracking-widest shadow-xl",
                selectedType === 'Credit Note' ? "bg-red-600 hover:bg-red-700" : ""
            )}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (selectedType === 'Credit Note' ? <ArrowDownLeft className="mr-2 h-4 w-4" /> : null)}
                {selectedType === 'Credit Note' ? 'Authorize Credit' : 'Finalize Entry'}
            </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
