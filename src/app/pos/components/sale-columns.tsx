
"use client";

import type { Sale } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Truck } from "lucide-react";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

export interface SaleColumnActions {
  onView: (sale: Sale) => void;
  onGenerateDelivery?: (sale: Sale) => void;
}

export const getSaleColumns = (actions: SaleColumnActions): ColumnDef<Sale>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-xs uppercase">{`RCL-${row.original.id.slice(0, 4)}`}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(new Date(row.getValue("date")), "MMM d, yyyy, h:mm a"),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => row.original.customerName || "N/A",
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
 
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Sale["status"];
      return <Badge variant={status === 'Paid' ? 'default' : 'secondary'}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original as Sale;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => actions.onView(sale)}>
                <FileText className="mr-2 h-4 w-4" /> View Receipt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onGenerateDelivery?.(sale)}>
                <Truck className="mr-2 h-4 w-4" /> Generate Delivery Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
