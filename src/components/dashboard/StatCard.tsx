import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
}

export function StatCard({ title, value, icon: Icon, trend, iconColor = "bg-primary" }: StatCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold mb-2">{value}</h3>
          {trend && (
            <p className={`text-sm ${trend.isPositive ? 'text-secondary' : 'text-destructive'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% vs mês anterior
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconColor} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}
