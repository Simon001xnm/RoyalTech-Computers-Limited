
"use client";

import type { Laptop } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// This is a simplified column definition. For a full DataTable, you'd use @tanstack/react-table.
export interface LaptopColumnActions {
  onEdit: (laptop: Laptop) => void;
  onDelete: (laptop: Laptop) => void;
  onViewDetails?: (laptop: Laptop) => void;
}

export const getLaptopColumns = (actions: LaptopColumnActions) => [
  {
    id: "select",
    header: ({ table }: any) => ( // table instance passed by Tanstack Table
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: any) => ( // row instance passed by Tanstack Table
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
    header: "Model",
    cell: ({ row }: any) => {
      const laptop = row.original as Laptop;
      return (
        <span className="font-medium">{laptop.model}</span>
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
      const status = row.getValue("status") as Laptop["status"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "Available") variant = "default"; // Using primary color for 'Available'
      if (status === "Leased") variant = "outline"; // Using a blue-ish color from theme
      if (status === "Repair") variant = "destructive"; // Using warning color
      
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "purchaseDate",
    header: "Purchase Date",
    cell: ({ row }: any) => {
      const date = row.getValue("purchaseDate") as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const laptop = row.original as Laptop;
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
              <DropdownMenuItem onClick={() => actions.onViewDetails?.(laptop)}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => actions.onEdit(laptop)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDelete(laptop)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
