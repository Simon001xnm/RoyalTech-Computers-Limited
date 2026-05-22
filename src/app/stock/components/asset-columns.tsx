
"use client";

import type { Asset } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, Laptop } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export interface AssetColumnActions {
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onViewDetails?: (asset: Asset) => void;
}

export const getAssetColumns = (actions: AssetColumnActions) => [
  {
    id: "select",
    header: ({ table }: any) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    header: "Asset Identity",
    cell: ({ row }: any) => {
      const asset = row.original as Asset;
      return (
        <div className="flex items-center gap-3">
            <div className="bg-primary/5 p-2 rounded-lg">
                <Laptop className="h-4 w-4 text-primary" />
            </div>
            <div>
                <span className="font-bold text-sm block">{asset.model}</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{asset.serialNumber}</span>
            </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Global Status",
    cell: ({ row }: any) => {
      const status = row.getValue("status") as Asset["status"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "Available") variant = "default";
      if (status === "Leased") variant = "outline";
      if (status === "Repair") variant = "destructive";
      
      return <Badge variant={variant} className="capitalize font-black text-[9px] px-3">{status}</Badge>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }: any) => <span className="font-bold">{row.original.quantity}</span>
  },
    {
    accessorKey: "purchasePrice",
    header: "Valuation",
     cell: ({ row }: any) => {
      const amount = parseFloat(row.getValue("purchasePrice")) || 0;
      const formatted = new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 0
      }).format(amount)
 
      return <div className="font-bold text-xs">{formatted}</div>
    },
  },
  {
    accessorKey: "purchaseDate",
    header: "Acquired",
    cell: ({ row }: any) => {
      const date = row.getValue("purchaseDate") as string;
      return <span className="text-xs font-medium text-muted-foreground">{new Date(date).toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Manage</div>,
    cell: ({ row }: any) => {
      const asset = row.original as Asset;
      return (
        <div className="text-right">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Unit Controls</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => actions.onEdit(asset)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Record
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => actions.onDelete(asset)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
