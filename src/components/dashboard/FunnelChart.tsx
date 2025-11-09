import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFunnelData } from "@/hooks/useDashboardMetrics";

export function FunnelChart() {
  const { data: funnelData, isLoading } = useFunnelData();

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Funil de Vendas</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!funnelData || funnelData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Funil de Vendas</h3>
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado disponível no funil
        </p>
      </Card>
    );
  }

  const maxValue = Math.max(...funnelData.map(stage => stage.value));

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-6">Funil de Vendas</h3>
      <div className="space-y-3">
        {funnelData.map((stage, index) => {
          const percentage = maxValue > 0 ? Math.round((stage.value / maxValue) * 100) : 0;
          
          return (
            <div key={stage.name} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{stage.name}</span>
                <div className="flex items-center gap-3">
                  {stage.conversao !== null && (
                    <span className="text-xs text-status-qualified font-medium">
                      ↑ {stage.conversao}% conversão
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {stage.value} ({percentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-8 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center justify-end px-3"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: stage.color || 'hsl(var(--primary))'
                  }}
                >
                  <span className="text-xs font-medium text-white">
                    {stage.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
