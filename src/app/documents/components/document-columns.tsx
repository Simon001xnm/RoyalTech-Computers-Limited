"use client";

import type { Document as AppDocument, DocumentType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Download, FileText, ListChecks, Receipt, FileWarning, Truck, FilePlus2, ShoppingCart, Printer, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";


export interface DocumentColumnActions {
  onView: (doc: AppDocument) => void;
  onDownload: (doc: AppDocument) => void;
  onPrint?: (doc: AppDocument) => void;
  onWhatsApp?: (doc: AppDocument) => void;
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
                <div className="text-right flex items-center justify-end gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50" onClick={() => actions.onWhatsApp?.(doc)}>
                                    <MessageCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Share to WhatsApp</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => actions.onPrint?.(doc)}>
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print Document</TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => actions.onDownload(doc)}>
                                    <Download className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download PDF</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Button variant="outline" size="sm" onClick={() => actions.onView(doc)} className="font-bold h-8">View</Button>
                </div>
            );
        },
    },
];
