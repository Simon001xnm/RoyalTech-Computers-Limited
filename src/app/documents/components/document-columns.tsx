"use client";

import type { Document as AppDocument, DocumentType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Download, FileText, ListChecks, Receipt, FileWarning, Truck, FilePlus2, ShoppingCart, MessageCircle, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";


export interface DocumentColumnActions {
  onView: (doc: AppDocument) => void;
  onDownload: (doc: AppDocument) => void;
  onDelete?: (doc: AppDocument) => void;
  onWhatsApp?: (doc: AppDocument) => void;
  onGenerateDelivery?: (doc: AppDocument) => void;
}

const documentIcons: Record<DocumentType, React.ElementType> = {
    Invoice: Receipt,
    Receipt: ListChecks,
    Proforma: FileText,
    RepairNote: FileWarning,
    DeliveryNote: Truck,
    Quotation: FilePlus2,
    LPO: ShoppingCart,
    PurchaseOrder: ShoppingCart,
    CreditNote: FileText,
    DebitNote: FileText,
    CustomerStatement: FileText,
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
            // Delivery notes can be generated from sales docs
            const canGenerateDelivery = ['Invoice', 'Receipt'].includes(doc.type);

            return (
                <div className="text-right flex items-center justify-end gap-2">
                    <TooltipProvider>
                        {canGenerateDelivery && actions.onGenerateDelivery && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => actions.onGenerateDelivery?.(doc)}>
                                        <Truck className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Generate Delivery Note</TooltipContent>
                            </Tooltip>
                        )}
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
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => actions.onDownload(doc)}>
                                    <Download className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download PDF</TooltipContent>
                        </Tooltip>
                        {actions.onDelete && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => actions.onDelete?.(doc)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Permanently</TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                    <Button variant="outline" size="sm" onClick={() => actions.onView(doc)} className="font-bold h-8">View</Button>
                </div>
            );
        },
    },
];
