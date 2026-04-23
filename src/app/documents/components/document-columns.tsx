
"use client";

import type { Document as AppDocument, DocumentType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Download, FileText, ListChecks, Receipt, FileWarning, Truck, FilePlus2, ShoppingCart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";


export interface DocumentColumnActions {
  onView: (doc: AppDocument) => void;
  onDownload: (doc: AppDocument) => void;
}

const documentIcons: Record<DocumentType, React.ElementType> = {
    Invoice: Receipt,
    Receipt: ListChecks,
    Proforma: FileText,
    RepairNote: FileWarning,
    DeliveryNote: Truck,
    Quotation: FilePlus2,
    LPO: ShoppingCart,
};

export const getDocumentColumns = (actions: DocumentColumnActions): ColumnDef<AppDocument>[] => [
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
            const doc = row.original;
            const Icon = documentIcons[doc.type] || FileText;
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="secondary" className="flex items-center justify-center w-10 h-10 p-0">
                                <Icon className="h-5 w-5" />
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{doc.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
        enableSorting: false,
    },
    {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
        accessorKey: "relatedTo",
        header: "Related To",
         cell: ({ row }) => <span className="text-sm text-muted-foreground max-w-xs truncate" title={row.original.relatedTo}>{row.original.relatedTo}</span>,
    },
    {
        accessorKey: "generatedDate",
        header: "Generated Date",
        cell: ({ row }) => format(new Date(row.original.generatedDate), "MMM d, yyyy HH:mm"),
    },
    {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const doc = row.original;
            return (
                <div className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => actions.onView(doc)}>View</Button>
                    <Button variant="outline" size="sm" onClick={() => actions.onDownload(doc)}>
                        <Download className="mr-2 h-3 w-3" /> Download
                    </Button>
                </div>
            );
        },
    },
];
