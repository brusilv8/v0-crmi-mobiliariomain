import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadCard } from "./LeadCard";
import type { FunilEtapa, LeadFunil } from "@/types/database.types";

interface KanbanColumnProps {
  etapa: FunilEtapa;
  leads: LeadFunil[];
  onLeadClick?: (lead: any) => void;
}

export function KanbanColumn({ etapa, leads, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa.id,
  });

  const tempoMedio = leads.length > 0
    ? Math.round(
        leads.reduce((acc, lf) => {
          const dias = Math.floor(
            (new Date().getTime() - new Date(lf.data_entrada).getTime()) / (1000 * 60 * 60 * 24)
          );
          return acc + dias;
        }, 0) / leads.length
      )
    : 0;

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-[240px]">
      <Card className={`h-full transition-all ${isOver ? 'ring-2 ring-primary shadow-lg' : ''}`}>
        <div className="px-3 py-3 border-b">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: etapa.cor }}
              />
              <h3 className="font-semibold text-sm">{etapa.nome}</h3>
            </div>
            <Badge 
              variant="secondary"
              className="text-xs font-semibold px-2 py-0.5"
            >
              {leads.length}
            </Badge>
          </div>
          
          {leads.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              ⌀ {tempoMedio}d nesta etapa
            </div>
          )}
        </div>

        <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
          {leads.map((leadFunil) => (
            <LeadCard
              key={leadFunil.id}
              lead={leadFunil.lead!}
              dataEntrada={leadFunil.data_entrada}
              onClick={() => onLeadClick?.(leadFunil.lead)}
            />
          ))}

          {leads.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <div className="mb-2 opacity-50">📋</div>
              Nenhum lead nesta etapa
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
