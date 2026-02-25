"use client";

import type { Customer } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export interface CustomerColumnActions {
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onViewDetails?: (customer: Customer) => void;
}

export const getCustomerColumns = (actions: CustomerColumnActions) => [
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
    accessorKey: "name",
    header: "Name",
    cell: ({ row }: any) => {
      const customer = row.original as Customer;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={customer.avatarUrl || `https://picsum.photos/seed/${customer.id}/40/40`} alt={customer.name} data-ai-hint="person avatar" />
            <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{customer.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }: any) => row.original.phone || "N/A",
  },
  {
    accessorKey: "registrationDate",
    header: "Registration Date",
    cell: ({ row }: any) => {
      const date = row.getValue("registrationDate") as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const customer = row.original as Customer;
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
                <DropdownMenuItem onClick={() => actions.onViewDetails?.(customer)}>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => actions.onEdit(customer)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDelete(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
