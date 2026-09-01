import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color?: string;
  subtitle?: string;
}

export function KPICard({ title, value, icon, color = "text-primary", subtitle }: KPICardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className={cn("text-xl md:text-2xl font-bold mt-1.5 truncate", color)}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-muted/50", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
