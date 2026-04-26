
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
        <div className="text-right flex items-center justify-end gap-2">
           <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 w-9 text-green-600 border-green-200 hover:bg-green-50 shadow-sm" onClick={() => actions.onWhatsApp?.(sale)}>
                            <MessageCircle className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>WhatsApp Receipt</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 w-9 text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm" onClick={() => actions.onView(sale)}>
                            <Printer className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Print/Download</TooltipContent>
                </Tooltip>
            </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 rounded-full">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
