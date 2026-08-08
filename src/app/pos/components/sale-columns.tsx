"use client";

import type { Sale, Document as AppDocument } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Truck, Download } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

export interface SaleColumnActions {
  onView: (doc: AppDocument) => void;
  onGenerateDelivery?: (doc: AppDocument) => void;
  onWhatsApp?: (doc: AppDocument) => void;
  onDownload?: (doc: AppDocument) => void;
}

/**
 * Ultra-Compact Columns for Mobile App Experience
 * Microscopic fonts and strict sizing for perfect screen fit.
 * COLOR CODING: Green (Receipt), Red (Invoice), Blue (Quotation)
 */
export const getSaleColumns = (actions: SaleColumnActions): ColumnDef<AppDocument>[] => [
  {
    accessorKey: "relatedTo",
    header: () => <div className="text-[7px] font-black uppercase">Client</div>,
    cell: ({ row }) => <span className="font-bold text-[8px] truncate block max-w-full">{row.original.relatedTo || "Walk-in"}</span>,
    size: 100,
  },
  {
    accessorKey: "type",
    header: () => <div className="text-[7px] font-black uppercase">Paper</div>,
    cell: ({ row }) => {
        const type = row.original.type;
        return (
            <Badge className={cn(
                "text-[7px] font-black uppercase px-1.5 h-3.5 border-none",
                type === 'Receipt' ? "bg-green-100 text-green-700" : (type === 'Invoice' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")
            )}>
                {type}
            </Badge>
        )
    }
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right text-[7px] font-black uppercase">Value</div>,
    cell: ({ row }) => {
      const type = row.original.type;
      const data = row.original.data;
      const amount = parseFloat(data?.total || data?.amount || 0);
      
      const formatted = new Intl.NumberFormat("en-KE", {
        style: "decimal",
        maximumFractionDigits: 0
      }).format(amount);
 
      return (
        <div className={cn(
            "text-right font-black text-[9px]",
            type === 'Receipt' ? "text-green-600" : (type === 'Invoice' ? "text-red-600" : "text-blue-600")
        )}>
            {formatted}
        </div>
      );
    },
    size: 70,
  },
  {
    id: "actions",
    header: () => <div className="text-right text-[7px] font-black uppercase">Ops</div>,
    cell: ({ row }) => {
      const docObj = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-6 w-6 p-0 rounded-full hover:bg-muted">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 border-none shadow-xl ring-1 ring-black/5 p-1">
              <DropdownMenuLabel className="text-[8px] uppercase font-black px-2 py-1 opacity-50">Workflows</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => actions.onView(docObj)} className="text-[9px] font-bold h-7 rounded-sm">
                <FileText className="mr-2 h-3 w-3" /> View Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDownload?.(docObj)} className="text-[9px] font-bold h-7 rounded-sm">
                <Download className="mr-2 h-3 w-3" /> PDF Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onGenerateDelivery?.(docObj)} className="font-black text-primary text-[9px] h-7 rounded-sm">
                <Truck className="mr-2 h-3 w-3" /> Dispatch Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 40,
  },
];
