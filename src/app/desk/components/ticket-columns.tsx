
"use client";

import type { Ticket } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

export interface TicketColumnActions {
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

export const getTicketColumns = (actions: TicketColumnActions) => [
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
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }: any) => <span className="font-medium">{row.original.subject}</span>,
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }: any) => {
      const priority = row.getValue("priority") as Ticket["priority"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (priority === "High") variant = "destructive";
      if (priority === "Medium") variant = "outline";
      return <Badge variant={variant}>{priority}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.getValue("status") as Ticket["status"];
       let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "Open") variant = "default";
      if (status === "In Progress") variant = "outline";
      if (status === "Closed") variant = "secondary";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }: any) => format(new Date(row.getValue("updatedAt")), "MMM d, yyyy"),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const ticket = row.original as Ticket;
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
            <DropdownMenuItem onClick={() => actions.onEdit(ticket)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Ticket
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDelete(ticket)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Ticket
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
