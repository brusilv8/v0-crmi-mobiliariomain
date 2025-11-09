import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Phone, 
  Mail, 
  Calendar, 
  FileText,
  MessageSquare
} from "lucide-react";
import { useRecentActivities } from "@/hooks/useDashboardMetrics";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const iconMap: Record<string, any> = {
  telefone: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  visita: Calendar,
  proposta: FileText,
  observacao: MessageSquare,
};

const colorMap: Record<string, string> = {
  telefone: 'bg-primary',
  email: 'bg-secondary',
  whatsapp: 'bg-secondary',
  visita: 'bg-warning',
  proposta: 'bg-status-proposal',
  observacao: 'bg-muted-foreground',
};

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivities();

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Atividades Recentes</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Atividades Recentes</h3>
        <p className="text-muted-foreground text-center py-8">
          Nenhuma atividade recente
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-6">Atividades Recentes</h3>
      <div className="space-y-4">
        {activities.map((activity: any) => {
          const Icon = iconMap[activity.tipo] || MessageSquare;
          const colorClass = colorMap[activity.tipo] || 'bg-muted-foreground';
          
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm capitalize">{activity.tipo}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.descricao}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </span>
                  {activity.lead?.nome && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {activity.lead.nome}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
