import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/hooks/useLeads";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { LeadDetailModal } from "@/components/leads/LeadDetailModal";
import { LeadFiltersSheet } from "@/components/leads/LeadFiltersSheet";
import type { Lead } from "@/types/database.types";
import { 
  Plus, 
  Search, 
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Flame,
  Snowflake,
  Sun
} from "lucide-react";


const temperatureIcons = {
  cold: Snowflake,
  warm: Sun,
  hot: Flame
};

const temperatureColors = {
  cold: 'text-temperature-cold bg-temperature-cold/10',
  warm: 'text-temperature-warm bg-temperature-warm/10',
  hot: 'text-temperature-hot bg-temperature-hot/10'
};

const temperatureLabels = {
  cold: 'Frio',
  warm: 'Morno',
  hot: 'Quente'
};

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<{
    temperatura?: string;
    origem?: string;
  }>({});
  const { data: leads, isLoading } = useLeads();

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = 
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm);
    
    const matchesTemperatura = !filters.temperatura || lead.temperatura === filters.temperatura;
    const matchesOrigem = !filters.origem || lead.origem === filters.origem;
    
    return matchesSearch && matchesTemperatura && matchesOrigem;
  }) || [];

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão de Leads</h1>
          <p className="text-muted-foreground">
            Gerencie e qualifique seus leads
          </p>
        </div>
        <Button className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant={hasActiveFilters ? "default" : "outline"} 
            className="gap-2"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {Object.values(filters).filter(v => v).length}
              </Badge>
            )}
          </Button>
        </div>
      </Card>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLeads.map((lead) => {
          const TempIcon = temperatureIcons[lead.temperatura];
          const tempColor = temperatureColors[lead.temperatura];
          const tempLabel = temperatureLabels[lead.temperatura];

            return (
              <Card 
                key={lead.id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{lead.nome}</h3>
                      <Badge variant="outline" className={tempColor}>
                        <TempIcon className="w-3 h-3 mr-1" />
                        {tempLabel}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {lead.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {lead.telefone}
                  </div>
                  {lead.interesse && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {lead.interesse}
                    </div>
                  )}
                  {lead.ultimo_contato && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Último contato: {new Date(lead.ultimo_contato).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Orçamento</p>
                    <p className="font-semibold text-primary">
                      {lead.orcamento_min && lead.orcamento_max
                        ? `${lead.orcamento_min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - ${lead.orcamento_max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                        : 'Não informado'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Origem</p>
                    <p className="font-medium text-sm">{lead.origem}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredLeads.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {hasActiveFilters || searchTerm
              ? "Nenhum lead encontrado com os filtros aplicados."
              : "Nenhum lead cadastrado ainda."}
          </p>
        </Card>
      )}

      <LeadFormModal open={modalOpen} onOpenChange={setModalOpen} />
      <LeadDetailModal 
        lead={selectedLead} 
        open={!!selectedLead} 
        onOpenChange={(open) => !open && setSelectedLead(null)} 
      />
      <LeadFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
