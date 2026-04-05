
"use client";

import type { Asset } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
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
    header: "Asset Model",
    cell: ({ row }: any) => {
      const asset = row.original as Asset;
      return (
        <span className="font-medium">{asset.model}</span>
      );
    },
  },
  {
    accessorKey: "serialNumber",
    header: "Serial Number",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.getValue("status") as Asset["status"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "Available") variant = "default";
      if (status === "Leased") variant = "outline";
      if (status === "Repair") variant = "destructive";
      
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Stock",
  },
  {
    accessorKey: "purchaseDate",
    header: "Date Acquired",
    cell: ({ row }: any) => {
      const date = row.getValue("purchaseDate") as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const asset = row.original as Asset;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {actions.onViewDetails && (
              <DropdownMenuItem onClick={() => actions.onViewDetails?.(asset)}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => actions.onEdit(asset)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Asset
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDelete(asset)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
