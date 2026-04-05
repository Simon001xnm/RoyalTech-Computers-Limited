
"use client";

import type { Applicant } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format, isValid } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ApplicantColumnActions {
  onEdit: (applicant: Applicant) => void;
  onDelete: (applicant: Applicant) => void;
}

const safeFormatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return isValid(date) ? format(date, "MMM d, yyyy") : "N/A";
};

export const getApplicantColumns = (actions: ApplicantColumnActions) => [
  {
    accessorKey: "name",
    header: "Applicant",
    cell: ({ row }: any) => {
      const applicant = row.original as Applicant;
      const name = applicant.name || "Unknown";
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://picsum.photos/seed/${applicant.id}/40/40`} alt={name} data-ai-hint="person avatar" />
            <AvatarFallback>{name.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium">{name}</span>
            <div className="text-xs text-muted-foreground">{applicant.email || "No email"}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "jobTitle",
    header: "Applied For",
    cell: ({ row }: any) => row.original.jobTitle || "N/A",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.getValue("status") as Applicant["status"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === "New") variant = "default";
      if (status === "Interview") variant = "outline";
      if (status === "Hired") variant = "default";
      if (status === "Rejected") variant = "destructive";
      return <Badge variant={variant}>{status || "New"}</Badge>;
    },
  },
  {
    accessorKey: "appliedAt",
    header: "Date Applied",
    cell: ({ row }: any) => safeFormatDate(row.getValue("appliedAt")),
  },
  {
    id: "actions",
    cell: ({ row }: any) => {
      const applicant = row.original as Applicant;
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
                <DropdownMenuItem onClick={() => actions.onEdit(applicant)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onDelete(applicant)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
