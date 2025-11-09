import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useFunilEtapas, useLeadsFunil, useUpdateLeadEtapa, useSyncLeadsToFunil } from "@/hooks/useFunilEtapas";
import { useFunilValidation } from "@/hooks/useFunilValidation";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { LeadCard } from "@/components/kanban/LeadCard";
import { LeadDetailModal } from "@/components/leads/LeadDetailModal";
import { QuickLeadFormModal } from "@/components/kanban/QuickLeadFormModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Filter, X, Flame, Sun, Snowflake, Users, ChevronRight, ChevronLeft, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import type { Lead, LeadFunil } from "@/types/database.types";

export default function Kanban() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [quickFormOpen, setQuickFormOpen] = useState(false);
  const [filters, setFilters] = useState({
    temperatura: 'all',
    origem: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: etapas, isLoading: etapasLoading } = useFunilEtapas();
  const { data: leadsFunil, isLoading: leadsFunilLoading } = useLeadsFunil();
  const updateLeadEtapa = useUpdateLeadEtapa();
  const syncLeads = useSyncLeadsToFunil();
  const { canMoveToEtapa } = useFunilValidation();

  // Get unique origins
  const origens = useMemo(() => {
    if (!leadsFunil) return [];
    const uniqueOrigins = new Set(leadsFunil.map((lf) => lf.lead?.origem).filter(Boolean));
    return Array.from(uniqueOrigins);
  }, [leadsFunil]);

  // Filter leads
  const filteredLeadsFunil = useMemo(() => {
    if (!leadsFunil) return [];
    return leadsFunil.filter((lf) => {
      if (!lf.lead) return false;
      
      if (filters.temperatura !== 'all' && lf.lead.temperatura !== filters.temperatura) {
        return false;
      }
      
      if (filters.origem !== 'all' && lf.lead.origem !== filters.origem) {
        return false;
      }
      
      return true;
    });
  }, [leadsFunil, filters]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all').length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newEtapaId = over.id as string;

    const currentLeadFunil = filteredLeadsFunil?.find((lf: LeadFunil) => lf.lead_id === leadId);
    if (!currentLeadFunil || currentLeadFunil.etapa_id === newEtapaId) return;

    // Validar progressão usando regras customizadas
    const validation = canMoveToEtapa(currentLeadFunil.etapa_id, newEtapaId);
    
    if (!validation.valid) {
      toast.error(validation.message || 'Movimento não permitido');
      return;
    }

    updateLeadEtapa.mutate({ leadId, etapaId: newEtapaId });
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  };

  const clearFilters = () => {
    setFilters({ temperatura: 'all', origem: 'all' });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const scrollToEnd = () => {
    const container = document.querySelector('.kanban-scroll');
    if (container) {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    }
  };

  const scrollToStart = () => {
    const container = document.querySelector('.kanban-scroll');
    if (container) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  if (etapasLoading || leadsFunilLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Pipeline de Vendas</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus leads no funil</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <Skeleton className="h-[500px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeLead = activeId
    ? filteredLeadsFunil?.find((lf: LeadFunil) => lf.lead_id === activeId)?.lead
    : null;

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold mb-3">Funil de Vendas</h1>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={filters.temperatura === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, temperatura: 'all' })}
            >
              Todos
            </Button>
            <Button
              variant={filters.temperatura === 'hot' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, temperatura: 'hot' })}
              className="gap-1.5"
            >
              <Flame className="w-3.5 h-3.5" />
              Quente
            </Button>
            <Button
              variant={filters.temperatura === 'warm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, temperatura: 'warm' })}
              className="gap-1.5"
            >
              <Sun className="w-3.5 h-3.5" />
              Morno
            </Button>
            <Button
              variant={filters.temperatura === 'cold' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, temperatura: 'cold' })}
              className="gap-1.5"
            >
              <Snowflake className="w-3.5 h-3.5" />
              Frio
            </Button>
          </div>

          <Select
            value={filters.origem}
            onValueChange={(value) => setFilters({ ...filters, origem: value })}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas origens</SelectItem>
              {origens.map((origem) => (
                <SelectItem key={origem} value={origem}>
                  {origem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            className="gap-2 bg-primary hover:bg-primary/90 h-9"
            onClick={() => setQuickFormOpen(true)}
          >
            <Users className="w-4 h-4" />
            Novo Atendimento
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => syncLeads.mutate()}
            disabled={syncLeads.isPending}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncLeads.isPending ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>

          <Link to="/settings?tab=funnel-rules">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              Regras do Funil
            </Button>
          </Link>
        </div>
      </div>

      {/* Seta para voltar ao início */}
      <button
        onClick={scrollToStart}
        className="fixed left-[280px] top-1/2 -translate-y-1/2 z-40 text-foreground/70 hover:text-foreground transition-all duration-300 cursor-pointer"
        title="Voltar ao início"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      {/* Seta para ir ao final */}
      <button
        onClick={scrollToEnd}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 text-foreground/70 hover:text-foreground transition-all duration-300 cursor-pointer"
        title="Ir para o final"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-2.5 overflow-x-auto pb-3 kanban-scroll">
          {etapas?.map((etapa) => {
            const leadsNaEtapa = filteredLeadsFunil?.filter(
              (lf: LeadFunil) => lf.etapa_id === etapa.id
            ) || [];

            return (
              <KanbanColumn
                key={etapa.id}
                etapa={etapa}
                leads={leadsNaEtapa}
                onLeadClick={handleLeadClick}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <LeadDetailModal
        lead={selectedLead}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      <QuickLeadFormModal
        open={quickFormOpen}
        onOpenChange={setQuickFormOpen}
      />
    </div>
  );
}
