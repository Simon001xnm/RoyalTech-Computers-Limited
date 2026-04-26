"use client";

import type { Sale } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Truck, Printer, MessageCircle, Download } from "lucide-react";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface SaleColumnActions {
  onView: (sale: Sale) => void;
  onGenerateDelivery?: (sale: Sale) => void;
  onWhatsApp?: (sale: Sale) => void;
}

export const getSaleColumns = (actions: SaleColumnActions): ColumnDef<Sale>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-xs uppercase font-bold">{`RCL-${row.original.id.slice(0, 4)}`}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(new Date(row.getValue("date")), "MMM d, h:mm a"),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => <span className="font-medium">{row.original.customerName || "Walk-in Client"}</span>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
      }).format(amount)
 
      return <div className="text-right font-black text-primary">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Sale["status"];
      return <Badge variant={status === 'Paid' ? 'default' : 'secondary'} className="font-black text-[9px] uppercase tracking-tighter">{status}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original as Sale;
      return (
        <div className="text-right flex items-center justify-end gap-1.5">
           <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-green-600" onClick={() => actions.onWhatsApp?.(sale)}>
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share via WhatsApp</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => actions.onView(sale)}>
                            <Printer className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Print/Download Receipt</TooltipContent>
                </Tooltip>
            </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sale Workflows</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => actions.onView(sale)}>
                <FileText className="mr-2 h-4 w-4" /> Open Full Receipt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onGenerateDelivery?.(sale)} className="font-bold text-primary">
                <Truck className="mr-2 h-4 w-4" /> Dispatch Delivery Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
