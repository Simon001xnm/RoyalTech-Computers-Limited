
"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { ModuleTutorial } from "./module-tutorial";

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
    <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-foreground">{title}</h1>
            <ModuleTutorial />
        </div>
        {description && <p className="text-sm text-muted-foreground font-medium">{description}</p>}
      </div>
      
      <div className="flex items-center gap-3">
        {actions ? (
            <div className="flex-shrink-0">{actions}</div>
        ) : (
            actionLabel && onAction && (
                <Button onClick={onAction} className="shadow-md font-bold">
                {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                {actionLabel}
                </Button>
            )
        )}
      </div>
    </div>
  );
}
