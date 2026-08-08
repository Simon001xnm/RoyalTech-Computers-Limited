
"use client";

import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, History, Package, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface AssetColumnActions {
  onEdit: (asset: Product) => void;
  onDelete: (asset: Product) => void;
  onAudit: (asset: Product) => void;
}

export const getAssetColumns = (actions: AssetColumnActions) => [
  {
    accessorKey: "name",
    header: "Product Identity",
    cell: ({ row }: any) => {
      const p = row.original as Product;
      const isLow = p.currentStock <= p.minStock;
      return (
        <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isLow ? "bg-red-50 text-red-600" : "bg-primary/5 text-primary")}>
                <Package className="h-4 w-4" />
            </div>
            <div>
                <span className="font-bold text-sm block leading-tight">{p.name}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{p.sku}</span>
                    {p.variants && p.variants.length > 0 && (
                        <Badge variant="outline" className="text-[8px] px-1 h-3.5 border-primary/20 text-primary font-black uppercase">{p.variants.length} VAR</Badge>
                    )}
                </div>
            </div>
        </div>
      );
    },
  },
  {
    accessorKey: "currentStock",
    header: "Inventory",
    cell: ({ row }: any) => {
      const p = row.original as Product;
      const isLow = p.currentStock <= p.minStock;
      const isOut = p.currentStock === 0;
      
      return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className={cn("text-sm font-black", isLow ? "text-red-600" : "text-foreground")}>
                    {p.currentStock} {p.unit}
                </span>
                {isLow && <AlertCircle className="h-3 w-3 text-red-500 animate-pulse" />}
            </div>
            <p className="text-[9px] font-bold uppercase opacity-40">Min: {p.minStock}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "sellingPriceRetail",
    header: "Retail (KES)",
    cell: ({ row }: any) => {
      const val = parseFloat(row.getValue("sellingPriceRetail")) || 0;
      return <div className="font-black text-xs">{val.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "locationBin",
    header: "Location",
    cell: ({ row }: any) => <span className="text-[10px] font-bold uppercase opacity-60">{row.original.locationBin || '--'}</span>
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ops</div>,
    cell: ({ row }: any) => {
      const asset = row.original as Product;
      return (
        <div className="text-right">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[10px] font-black uppercase">Internal Controls</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => actions.onAudit(asset)}>
                <History className="mr-2 h-4 w-4" /> Stock Audit Trail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onEdit(asset)}>
                <Edit className="mr-2 h-4 w-4" /> Modify Specifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => actions.onDelete(asset)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Nuclear Purge
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
