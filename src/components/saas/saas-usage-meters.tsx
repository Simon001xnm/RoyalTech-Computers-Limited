
'use client';

import { useSaaS } from "./saas-provider";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaaSUsageMeters() {
    const { plan, usage, isLegacyUser } = useSaaS();

    if (!plan || !usage) return null;

    const assetPercentage = Math.min(100, (usage.assets / plan.maxAssets) * 100);
    const salesPercentage = Math.min(100, (usage.salesThisMonth / plan.maxSalesPerMonth) * 100);

    const Meter = ({ title, current, max, percentage, icon: Icon }: any) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Icon className="h-3 w-3" />
                    <span>{title}</span>
                </div>
                <span>{current} / {isLegacyUser ? '∞' : max}</span>
            </div>
            <Progress value={isLegacyUser ? 0 : percentage} className="h-2" />
            {!isLegacyUser && percentage > 80 && (
                <p className="text-[10px] text-destructive font-bold animate-pulse">Running low on space!</p>
            )}
        </div>
    );

    return (
        <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">Workspace Usage</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <Meter 
                    title="Asset Capacity" 
                    current={usage.assets} 
                    max={plan.maxAssets} 
                    percentage={assetPercentage} 
                    icon={Package} 
                />
                <Meter 
                    title="Monthly Sales Volume" 
                    current={usage.salesThisMonth} 
                    max={plan.maxSalesPerMonth} 
                    percentage={salesPercentage} 
                    icon={TrendingUp} 
                />
                
                {isLegacyUser && (
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                        <p className="text-[10px] text-primary font-bold uppercase leading-tight">
                            Gold Version Active: Usage limits are currently disabled for your workspace.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
