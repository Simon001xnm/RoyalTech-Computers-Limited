
"use client";

import { useState, useEffect } from 'react';
import type { ItemIssuance, Sale } from '@/types';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

interface MarkSoldFormProps {
    issuance: ItemIssuance | null;
    onSubmit: (data: { sellingPrice: number; paymentMethod: Sale['paymentMethod']; notes?: string }) => void;
    onCancel: () => void;
}

export function MarkSoldForm({ issuance, onSubmit, onCancel }: MarkSoldFormProps) {
    const [sellingPrice, setSellingPrice] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Cash');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (issuance?.expectedSellingPrice) {
            setSellingPrice(issuance.expectedSellingPrice.toString());
        } else {
            setSellingPrice('');
        }
    }, [issuance]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(sellingPrice);
        if (isNaN(price) || price <= 0) {
            alert("Please enter a valid selling price.");
            return;
        }
        onSubmit({ sellingPrice: price, paymentMethod, notes });
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
             <div className="space-y-2">
                <label htmlFor="sellingPrice" className="text-sm font-medium">Selling Price (KES)</label>
                <Input id="sellingPrice" type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="Enter final price" required />
            </div>
             <div className="space-y-2">
                <label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method</label>
                <Select onValueChange={(val) => setPaymentMethod(val as any)} defaultValue={paymentMethod}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="Till">Till</SelectItem>
                        <SelectItem value="Paybill">Paybill</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about the sale..." />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Record Sale</Button>
            </DialogFooter>
        </form>
    );
}
