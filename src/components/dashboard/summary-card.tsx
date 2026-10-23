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
    <Card className={cn("shadow-sm border-border transition-all hover:shadow-md hover:ring-2 hover:ring-primary/5 group overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:pb-2">
        <CardTitle className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/60">{title}</CardTitle>
        <div className="bg-primary/5 p-1.5 rounded-lg group-hover:bg-primary/10 transition-colors ring-1 ring-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:pb-4 space-y-0.5">
        <div className="text-xl sm:text-2xl font-black tracking-tighter text-foreground truncate">{value}</div>
        {description && <p className="text-[9px] font-bold text-muted-foreground/80 uppercase truncate">{description}</p>}
        {trend && (
            <div className={cn(
                "text-[8px] font-black mt-2 inline-flex items-center px-1.5 py-0.5 rounded-md border uppercase tracking-tighter",
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