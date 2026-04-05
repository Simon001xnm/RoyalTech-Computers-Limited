
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

  return (
    <Card className={cn("shadow-sm border-muted/40 transition-all hover:shadow-md group", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
            <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-black tracking-tight text-foreground">{value}</div>
        {description && <p className="text-[10px] font-medium text-muted-foreground/80">{description}</p>}
        {trend && (
            <div className={cn(
                "text-[10px] font-bold mt-2 inline-flex items-center px-2 py-0.5 rounded-full border",
                isPositiveTrend ? "text-green-600 bg-green-50 border-green-100" : "text-blue-600 bg-blue-50 border-blue-100"
            )}>
                {trend}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
