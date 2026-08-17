"use client";

import type { Asset } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

export interface LaptopColumnActions {
  onEdit: (laptop: Asset) => void;
  onDelete: (laptop: Asset) => void;
}

export const getLaptopColumns = (actions: LaptopColumnActions) => [
  {
    id: "select",
    header: ({ table }: any) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: any) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "model",
    header: "Model / Item",
    cell: ({ row }: any) => {
      const asset = row.original as Asset;
      return (
        <div className="flex items-center gap-3">
            <div className="bg-primary/5 p-1.5 rounded-lg text-primary">
                <Package className="h-4 w-4" />
            </div>
            <span className="font-bold uppercase text-xs tracking-tight">{asset.model}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "serialNumber",
    header: "Serial Number",
    cell: ({ row }: any) => <span className="font-mono text-[10px] uppercase opacity-60">{row.original.serialNumber}</span>
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.getValue("status") as Asset["status"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "Available") variant = "default";
      if (status === "Leased") variant = "outline";
      if (status === "Sold") variant = "destructive";
      
      return <Badge variant={variant} className="text-[9px] font-black uppercase h-4 px-2">{status}</Badge>;
    },
  },
  {
    accessorKey: "purchaseDate",
    header: "Date Registered",
    cell: ({ row }: any) => {
        const date = row.getValue("purchaseDate") as string;
        if (!date) return 'N/A';
        return format(new Date(date), "MMM d, yyyy HH:mm");
    }
  },
  {
    accessorKey: "sellingPrice",
    header: "Selling Price",
    cell: ({ row }: any) => {
      const val = parseFloat(row.getValue("sellingPrice")) || 0;
      return <div className="font-black text-primary text-xs">KES {val.toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }: any) => {
      const asset = row.original as Asset;
      return (
        <div className="text-right">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50">Operations</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => actions.onEdit(asset)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => actions.onDelete(asset)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Remove Item
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];