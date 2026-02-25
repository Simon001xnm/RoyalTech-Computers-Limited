
"use client";

import type { ItemIssuance } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, DollarSign, CornerDownLeft, Laptop, Component } from "lucide-react";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";

export interface IssuanceColumnActions {
  onMarkAsSold: (issuance: ItemIssuance) => void;
  onMarkAsReturned: (issuance: ItemIssuance) => void;
}

export const getIssuanceColumns = (actions: IssuanceColumnActions): ColumnDef<ItemIssuance>[] => [
  {
    accessorKey: "itemName",
    header: "Item",
    cell: ({ row }) => {
        const Icon = row.original.itemType === 'laptop' ? Laptop : Component;
        return (
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                    <span className="font-medium">{row.original.itemName}</span>
                    <p className="text-xs text-muted-foreground">S/N: {row.original.itemSerialNumber}</p>
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "dateIssued",
    header: "Date Issued",
    cell: ({ row }) => format(new Date(row.getValue("dateIssued")), "MMM d, yyyy"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as ItemIssuance["status"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "Issued") variant = "outline";
      if (status === "Sold") variant = "default";
      if (status === "Returned") variant = "destructive";

      return <Badge variant={variant}>{status}</Badge>;
    },
  },
    {
    accessorKey: "dateSold",
    header: "Date Sold/Returned",
    cell: ({ row }) => {
        const issuance = row.original;
        const dateToShow = issuance.dateSold || issuance.dateReturned;
        return dateToShow ? format(new Date(dateToShow), "MMM d, yyyy") : 'N/A';
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const issuance = row.original as ItemIssuance;

      if (issuance.status !== 'Issued') {
        return null; // No actions for sold or returned items
      }

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
              <DropdownMenuItem onClick={() => actions.onMarkAsSold(issuance)}>
                <DollarSign className="mr-2 h-4 w-4" /> Mark as Sold
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onMarkAsReturned(issuance)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <CornerDownLeft className="mr-2 h-4 w-4" /> Mark as Returned
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
