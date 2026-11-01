import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string; 
  className?: string;
}

export function SummaryCard({ title, value, icon: Icon, description, trend, className }: SummaryCardProps) {
  const isPositiveTrend = trend?.startsWith('+');
  const isNegativeTrend = trend?.startsWith('-');

  return (
    <Card className={cn("shadow-sm border-border transition-all hover:shadow-md group overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground">{title}</CardTitle>
        <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
            <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1">
        <div className="text-2xl font-bold tracking-tight text-foreground truncate">{value}</div>
        {description && <p className="text-[11px] font-medium text-muted-foreground leading-none">{description}</p>}
        {trend && (
            <div className={cn(
                "text-[10px] font-bold mt-2 inline-flex items-center px-2 py-0.5 rounded-md border",
                isPositiveTrend ? "text-green-600 bg-green-50 border-green-100" : 
                isNegativeTrend ? "text-red-600 bg-red-50 border-red-100" :
                "text-blue-600 bg-blue-50 border-blue-100"
            )}>
                {trend}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
