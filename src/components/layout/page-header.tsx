
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
    <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions ? (
        <div className="flex-shrink-0">{actions}</div>
      ) : (
        actionLabel && onAction && (
            <Button onClick={onAction}>
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {actionLabel}
            </Button>
        )
      )}
    </div>
  );
}
