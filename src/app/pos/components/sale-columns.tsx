"use client";

import type { Sale } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Truck, Download } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

export interface SaleColumnActions {
  onView: (sale: Sale) => void;
  onGenerateDelivery?: (sale: Sale) => void;
  onWhatsApp?: (sale: Sale) => void;
  onDownload?: (sale: Sale) => void;
}

/**
 * Ultra-Compact Columns for Mobile App Experience
 * Microscopic fonts and strict sizing for perfect screen fit.
 */
export const getSaleColumns = (actions: SaleColumnActions): ColumnDef<Sale>[] => [
  {
    accessorKey: "customerName",
    header: () => <div className="text-[7px] font-black uppercase">Client</div>,
    cell: ({ row }) => <span className="font-bold text-[8px] truncate block max-w-full">{row.original.customerName || "Walk-in"}</span>,
    size: 100,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right text-[7px] font-black uppercase">KES</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-KE", {
        style: "decimal",
        maximumFractionDigits: 0
      }).format(amount)
 
      return <div className="text-right font-black text-primary text-[8px]">{formatted}</div>
    },
    size: 70,
  },
  {
    accessorKey: "status",
    header: () => <div className="hidden text-[7px] font-black uppercase">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue("status") as Sale["status"];
      return <div className="hidden"><Badge variant={status === 'Paid' ? 'default' : 'secondary'} className="font-black text-[7px] h-3.5 uppercase tracking-tighter px-1">{status}</Badge></div>;
    },
    size: 0,
  },
  {
    id: "actions",
    header: () => <div className="text-right text-[7px] font-black uppercase">Ops</div>,
    cell: ({ row }) => {
      const sale = row.original as Sale;
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
              <DropdownMenuItem onClick={() => actions.onView(sale)} className="text-[9px] font-bold h-7 rounded-sm">
                <FileText className="mr-2 h-3 w-3" /> View Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDownload?.(sale)} className="text-[9px] font-bold h-7 rounded-sm">
                <Download className="mr-2 h-3 w-3" /> PDF Receipt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onGenerateDelivery?.(sale)} className="font-black text-primary text-[9px] h-7 rounded-sm">
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
