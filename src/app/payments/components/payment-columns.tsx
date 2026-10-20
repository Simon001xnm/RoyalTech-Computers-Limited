"use client";

import type { Payment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { 
    Banknote, 
    Wallet, 
    Landmark, 
    CreditCard, 
    ArrowDownLeft, 
    History,
    Receipt,
    MonitorSmartphone,
    CreditCard as ChequeIcon
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

const methodIcons: Record<string, any> = {
    'Cash': Banknote,
    'M-Pesa': Wallet,
    'Paybill': MonitorSmartphone,
    'Till': Receipt,
    'Bank': Landmark,
    'Card': CreditCard,
    'Cheque': ChequeIcon,
    'Credit': History,
};

export const getPaymentColumns = (): ColumnDef<Payment>[] => [
    {
        accessorKey: "date",
        header: "Date & Time",
        cell: ({ row }) => {
            const date = parseISO(row.original.date);
            return (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase">{format(date, 'dd MMM yyyy')}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">{format(date, 'hh:mm a')}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "customerName",
        header: "Client Account",
        cell: ({ row }) => (
            <span className="text-[10px] font-black uppercase truncate block max-w-[150px]">
                {row.original.customerName || 'Walk-in'}
            </span>
        ),
    },
    {
        accessorKey: "type",
        header: "Entry Type",
        cell: ({ row }) => {
            const type = row.original.type;
            const isCredit = type === 'Credit Note';
            return (
                <Badge variant={isCredit ? "destructive" : "default"} className={cn(
                    "text-[8px] font-black uppercase h-4 px-2 border-none",
                    isCredit ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                )}>
                    {isCredit ? <ArrowDownLeft className="h-2 w-2 mr-1" /> : null}
                    {type}
                </Badge>
            );
        }
    },
    {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => {
            const method = row.original.method;
            const Icon = methodIcons[method] || Wallet;
            return (
                <div className="flex items-center gap-2">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">{method}</span>
                </div>
            );
        }
    },
    {
        accessorKey: "reference",
        header: "Ref / Serial",
        cell: ({ row }) => (
            <span className="text-[9px] font-mono opacity-50 uppercase">{row.original.reference || '—'}</span>
        ),
    },
    {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
            const isCredit = row.original.type === 'Credit Note';
            const amount = Number(row.original.amount || 0);
            return (
                <div className={cn(
                    "text-right font-black text-xs",
                    isCredit ? "text-red-600" : "text-green-600"
                )}>
                    {isCredit ? "-" : ""}
                    {new Intl.NumberFormat('en-KE', { 
                        style: 'currency', 
                        currency: 'KES', 
                        maximumFractionDigits: 0 
                    }).format(amount)}
                </div>
            );
        }
    },
];
