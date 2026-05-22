
"use client";

import type { Lease } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, CalendarCheck2, CalendarX2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, differenceInDays, parseISO, isAfter } from "date-fns";
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface LeaseColumnActions {
  onEdit: (lease: Lease) => void;
  onDelete: (lease: Lease) => void;
  onViewDetails?: (lease: Lease) => void;
  onMarkPaid?: (lease: Lease) => void;
  onTerminate?: (lease: Lease) => void;
}

const DaysRemainingCell = ({ lease }: { lease: Lease }) => {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (lease.status === 'Expired' || lease.status === 'Terminated') {
      setDays(null);
      return;
    }
    const calculatedDays = differenceInDays(parseISO(lease.endDate), new Date());
    setDays(calculatedDays);
  }, [lease.endDate, lease.status]);

  if (lease.status === 'Expired' || lease.status === 'Terminated') {
    return <Badge variant="outline">N/A</Badge>;
  }

  if (days === null) return null;

  const isOverdue = days < 0;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isOverdue ? "destructive" : "secondary"}
        className={cn(
          "font-bold",
          !isOverdue && days <= 7 ? "bg-orange-500 text-white" : ""
        )}
      >
        {isOverdue ? "Overdue" : `${days} days left`}
      </Badge>
      {isOverdue && <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />}
    </div>
  );
};

export const getLeaseColumns = (actions: LeaseColumnActions) => [
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
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }: any) => <span className="font-medium">{row.original.customerName}</span>,
  },
  {
    accessorKey: "laptopModel",
    header: "Laptop Model",
  },
  {
    accessorKey: "endDate",
    header: "Due Date",
    cell: ({ row }: any) => format(parseISO(row.getValue("endDate")), "MMM d, yyyy"),
  },
  {
    id: "daysRemaining",
    header: "Status Tracking",
    cell: ({ row }: any) => <DaysRemainingCell lease={row.original} />
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }: any) => {
      const status = row.getValue("paymentStatus") as Lease["paymentStatus"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "Paid") variant = "default";
      if (status === "Pending") variant = "outline";
      if (status === "Overdue") variant = "destructive";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Lease Status",
    cell: ({ row }: any) => {
      const status = row.getValue("status") as Lease["status"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "Active") variant = "default";
      if (status === "Upcoming") variant = "outline";
      if (status === "Expired" || status === "Terminated") variant = "destructive";
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const lease = row.original as Lease;
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
            <DropdownMenuItem onClick={() => actions.onEdit(lease)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Lease
            </DropdownMenuItem>
            {lease.paymentStatus !== "Paid" && actions.onMarkPaid && (
                 <DropdownMenuItem onClick={() => actions.onMarkPaid?.(lease)}>
                    <CalendarCheck2 className="mr-2 h-4 w-4" /> Mark as Paid
                </DropdownMenuItem>
            )}
            {lease.status === "Active" && actions.onTerminate && (
                 <DropdownMenuItem onClick={() => actions.onTerminate?.(lease)} className="text-orange-600 focus:text-orange-600 focus:bg-orange-500/10">
                    <CalendarX2 className="mr-2 h-4 w-4" /> Terminate Lease
                </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDelete(lease)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Lease
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
