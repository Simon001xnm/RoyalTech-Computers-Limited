"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  ActionIcon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actionLabel, onAction, ActionIcon, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-lg border bg-card p-4 md:p-5 shadow-sm sm:flex-row sm:items-center">
      <div className="space-y-1 w-full sm:w-auto">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
        {description && <p className="text-xs md:text-sm text-muted-foreground font-medium line-clamp-1">{description}</p>}
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {actions ? (
            <div className="flex-shrink-0 w-full sm:w-auto">{actions}</div>
        ) : (
            actionLabel && onAction && (
                <Button onClick={onAction} className="w-full sm:w-auto shadow-sm font-semibold text-xs md:text-sm h-9 md:h-10">
                {ActionIcon && <ActionIcon className="mr-1.5 h-4 w-4" />}
                {actionLabel}
                </Button>
            )
        )}
      </div>
    </div>
  );
}
