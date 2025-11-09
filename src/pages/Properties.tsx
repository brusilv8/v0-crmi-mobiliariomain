import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { 
  Plus, 
  Search, 
  Filter,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Square,
  Eye,
  Home
} from "lucide-react";
import { useImoveis } from "@/hooks/useImoveis";
import { PropertyFormModal } from "@/components/properties/PropertyFormModal";
import { PropertyDetailModal } from "@/components/properties/PropertyDetailModal";
import { PropertyFiltersSheet, type PropertyFilters } from "@/components/properties/PropertyFiltersSheet";
import type { Imovel } from "@/types/database.types";

const statusLabels = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  alugado: 'Alugado'
};

const statusColors = {
  disponivel: 'bg-secondary/10 text-secondary',
  reservado: 'bg-warning/10 text-warning',
  vendido: 'bg-muted text-muted-foreground',
  alugado: 'bg-primary/10 text-primary'
};

export default function Properties() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Imovel | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const { data: imoveis, isLoading } = useImoveis();

  const filteredProperties = useMemo(() => {
    let result = imoveis || [];

    // Busca por texto
    if (searchTerm) {
      result = result.filter(property =>
        property.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.bairro.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros
    if (filters.tipo) {
      result = result.filter(p => p.tipo === filters.tipo);
    }
    if (filters.finalidade) {
      result = result.filter(p => p.finalidade === filters.finalidade);
    }
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters.cidade) {
      result = result.filter(p => 
        p.cidade.toLowerCase().includes(filters.cidade!.toLowerCase())
      );
    }
    if (filters.bairro) {
      result = result.filter(p => 
        p.bairro.toLowerCase().includes(filters.bairro!.toLowerCase())
      );
    }
    if (filters.precoMin || filters.precoMax) {
      result = result.filter(p => {
        const valor = p.finalidade === 'venda' ? p.valor_venda : p.valor_aluguel;
        if (!valor) return false;
        if (filters.precoMin && valor < filters.precoMin) return false;
        if (filters.precoMax && valor > filters.precoMax) return false;
        return true;
      });
    }

    return result;
  }, [imoveis, searchTerm, filters]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined).length;

  const handlePropertyClick = (property: Imovel) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Catálogo de Imóveis</h1>
          <p className="text-muted-foreground">
            Gerencie seu portfólio de imóveis
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Novo Imóvel
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, endereço ou tipo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="gap-2 relative"
            onClick={() => setIsFiltersOpen(true)}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.tipo && (
              <Badge variant="secondary" className="gap-1">
                Tipo: {filters.tipo}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, tipo: undefined })}
                />
              </Badge>
            )}
            {filters.finalidade && (
              <Badge variant="secondary" className="gap-1">
                {filters.finalidade === 'venda' ? 'Venda' : 'Aluguel'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, finalidade: undefined })}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusLabels[filters.status]}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, status: undefined })}
                />
              </Badge>
            )}
            {filters.cidade && (
              <Badge variant="secondary" className="gap-1">
                {filters.cidade}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, cidade: undefined })}
                />
              </Badge>
            )}
            {filters.bairro && (
              <Badge variant="secondary" className="gap-1">
                {filters.bairro}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, bairro: undefined })}
                />
              </Badge>
            )}
            {(filters.precoMin || filters.precoMax) && (
              <Badge variant="secondary" className="gap-1">
                R$ {filters.precoMin || 0} - R$ {filters.precoMax || '∞'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, precoMin: undefined, precoMax: undefined })}
                />
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="grid grid-cols-4 gap-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card className="p-12 text-center">
          <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Nenhum imóvel encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Tente ajustar sua busca' : 'Comece cadastrando seu primeiro imóvel'}
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Imóvel
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const valor = property.finalidade === 'venda' ? property.valor_venda : property.valor_aluguel;
            const valorFormatado = valor ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'A consultar';
            
            return (
              <Card 
                key={property.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handlePropertyClick(property)}
              >
                <div className="relative h-48 bg-muted">
                  {property.imagem_principal ? (
                    <img 
                      src={property.imagem_principal} 
                      alt={`${property.tipo} - ${property.endereco}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className={`absolute top-4 right-4 ${statusColors[property.status]}`}>
                    {statusLabels[property.status]}
                  </Badge>
                </div>
                
                <div className="p-6">
                  <div className="mb-3">
                    <Badge variant="outline" className="mb-2">
                      {property.tipo} • {property.finalidade === 'venda' ? 'Venda' : 'Aluguel'}
                    </Badge>
                    <h3 className="font-semibold text-lg mb-1">
                      {property.tipo} em {property.bairro}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {property.endereco}, {property.cidade} - {property.estado}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
                    <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                      <BedDouble className="w-4 h-4 mb-1 text-muted-foreground" />
                      <span className="font-medium">{property.quartos || 0}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                      <Bath className="w-4 h-4 mb-1 text-muted-foreground" />
                      <span className="font-medium">{property.banheiros || 0}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                      <Car className="w-4 h-4 mb-1 text-muted-foreground" />
                      <span className="font-medium">{property.vagas || 0}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                      <Square className="w-4 h-4 mb-1 text-muted-foreground" />
                      <span className="font-medium">{property.area_util || 0}m²</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {property.finalidade === 'venda' ? 'Valor' : 'Aluguel'}
                      </p>
                      <p className="font-bold text-xl text-primary">{valorFormatado}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PropertyFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <PropertyDetailModal 
        property={selectedProperty}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
      <PropertyFiltersSheet
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
