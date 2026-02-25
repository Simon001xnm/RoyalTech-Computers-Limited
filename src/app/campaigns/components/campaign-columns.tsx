
"use client";

import type { Campaign } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Send } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

export interface CampaignColumnActions {
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onSend: (campaign: Campaign) => void;
}

export const getCampaignColumns = (actions: CampaignColumnActions) => [
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
    accessorKey: "name",
    header: "Campaign Name",
    cell: ({ row }: any) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "subject",
    header: "Subject",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.getValue("status") as Campaign["status"];
       let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "Sent") variant = "default";
      if (status === "Draft") variant = "outline";
      if (status === "Archived") variant = "secondary";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }: any) => format(new Date(row.getValue("createdAt")), "MMM d, yyyy"),
  },
  {
    accessorKey: "sentAt",
    header: "Sent Date",
    cell: ({ row }: any) => {
        const sentAt = row.getValue("sentAt") as string | undefined;
        return sentAt ? format(new Date(sentAt), "MMM d, yyyy") : 'N/A';
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const campaign = row.original as Campaign;
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
            {campaign.status === 'Draft' && (
                <DropdownMenuItem onClick={() => actions.onSend(campaign)}>
                    <Send className="mr-2 h-4 w-4" /> Send (Simulate)
                </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => actions.onEdit(campaign)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Campaign
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDelete(campaign)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Campaign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
