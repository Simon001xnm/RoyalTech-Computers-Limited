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
    <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-lg border bg-card p-3 md:p-5 shadow-sm sm:flex-row sm:items-center">
      <div className="space-y-0.5 w-full sm:w-auto">
        <div className="flex items-center justify-between sm:justify-start gap-2">
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-foreground truncate">{title}</h1>
        </div>
        {description && <p className="text-[10px] md:text-sm text-muted-foreground font-medium line-clamp-1 uppercase tracking-tight">{description}</p>}
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {actions ? (
            <div className="flex-shrink-0 w-full sm:w-auto">{actions}</div>
        ) : (
            actionLabel && onAction && (
                <Button onClick={onAction} className="w-full sm:w-auto shadow-md font-bold text-[10px] md:text-sm h-8 md:h-10 uppercase tracking-widest">
                {ActionIcon && <ActionIcon className="mr-1.5 h-3.5 w-3.5" />}
                {actionLabel}
                </Button>
            )
        )}
      </div>
    </div>
  );
}