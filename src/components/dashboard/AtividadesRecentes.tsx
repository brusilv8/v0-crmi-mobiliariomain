import { useAtividades } from "@/hooks/useAtividades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  TrendingUp,
  Calendar,
  FileText,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const iconMap: Record<string, React.ComponentType<any>> = {
  lead_criado: UserPlus,
  lead_finalizado: XCircle,
  lead_reativado: CheckCircle,
  etapa_alterada: TrendingUp,
  visita_agendada: Calendar,
  visita_status_alterado: Clock,
  proposta_enviada: FileText,
  proposta_criada: FileText,
  proposta_status_alterado: FileText,
  proposta_finalizada: XCircle,
  proposta_editada: FileText,
  proposta_excluida: XCircle,
  historico_acessado: Clock,
  imovel_criado: Home,
};

const colorMap: Record<string, string> = {
  lead_criado: "bg-primary/10 text-primary",
  lead_finalizado: "bg-destructive/10 text-destructive",
  lead_reativado: "bg-status-qualified/10 text-status-qualified",
  etapa_alterada: "bg-status-qualified/10 text-status-qualified",
  visita_agendada: "bg-warning/10 text-warning",
  visita_status_alterado: "bg-secondary/10 text-secondary",
  proposta_enviada: "bg-status-proposal/10 text-status-proposal",
  proposta_criada: "bg-status-proposal/10 text-status-proposal",
  proposta_status_alterado: "bg-status-proposal/10 text-status-proposal",
  proposta_finalizada: "bg-destructive/10 text-destructive",
  proposta_editada: "bg-secondary/10 text-secondary",
  proposta_excluida: "bg-destructive/10 text-destructive",
  historico_acessado: "bg-muted text-muted-foreground",
  imovel_criado: "bg-status-contacted/10 text-status-contacted",
};

const getBadgeVariant = (tipo: string, metadata?: any): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  if (tipo === "proposta_status_alterado" && metadata?.status_novo) {
    switch (metadata.status_novo) {
      case "aceita":
        return { label: "Aceita", variant: "default" };
      case "recusada":
        return { label: "Recusada", variant: "destructive" };
      case "em_analise":
        return { label: "Em Análise", variant: "secondary" };
      case "cancelada":
        return { label: "Cancelada", variant: "destructive" };
      default:
        return { label: metadata.status_novo, variant: "outline" };
    }
  }

  if (tipo === "visita_status_alterado" && metadata?.status_novo) {
    switch (metadata.status_novo) {
      case "realizada":
        return { label: "Realizada", variant: "default" };
      case "cancelada":
        return { label: "Cancelada", variant: "destructive" };
      default:
        return { label: metadata.status_novo, variant: "outline" };
    }
  }

  if (tipo === "lead_finalizado") {
    return { label: "Finalizado", variant: "destructive" };
  }

  if (tipo === "lead_reativado") {
    return { label: "Reativado", variant: "default" };
  }

  if (tipo === "proposta_finalizada") {
    return { label: "Arquivada", variant: "destructive" };
  }

  return { label: "", variant: "outline" };
};

export function AtividadesRecentes() {
  const { data: atividades, isLoading } = useAtividades(15);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!atividades || atividades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade recente
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              As ações do sistema aparecerão aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {atividades.map((atividade) => {
              const Icon = iconMap[atividade.tipo] || Activity;
              const colorClass = colorMap[atividade.tipo] || "bg-muted text-muted-foreground";
              const badge = getBadgeVariant(atividade.tipo, atividade.metadata);

              return (
                <div
                  key={atividade.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {atividade.titulo}
                        </p>
                        {atividade.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {atividade.descricao}
                          </p>
                        )}
                      </div>
                      {badge.label && (
                        <Badge variant={badge.variant} className="shrink-0 text-xs">
                          {badge.label}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {atividade.usuario && (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={atividade.usuario.avatar_url} />
                            <AvatarFallback className="text-[10px]">
                              {atividade.usuario.nome_completo
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {atividade.usuario.nome_completo.split(" ")[0]}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        •
                      </span>
                      <time className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(atividade.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
