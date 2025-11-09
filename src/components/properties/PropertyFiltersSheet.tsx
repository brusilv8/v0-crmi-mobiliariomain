import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface PropertyFilters {
  tipo?: string;
  finalidade?: 'venda' | 'aluguel';
  status?: 'disponivel' | 'reservado' | 'vendido' | 'alugado';
  cidade?: string;
  bairro?: string;
  precoMin?: number;
  precoMax?: number;
}

interface PropertyFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

export function PropertyFiltersSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: PropertyFiltersSheetProps) {
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const handleApply = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>
            Refine sua busca de imóveis
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 mt-6 pb-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de Imóvel</Label>
              <Select
                value={filters.tipo || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, tipo: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Apartamento">Apartamento</SelectItem>
                  <SelectItem value="Casa">Casa</SelectItem>
                  <SelectItem value="Cobertura">Cobertura</SelectItem>
                  <SelectItem value="Terreno">Terreno</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Galpão">Galpão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Finalidade */}
            <div className="space-y-2">
              <Label>Finalidade</Label>
              <RadioGroup
                value={filters.finalidade || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ 
                    ...filters, 
                    finalidade: value === 'all' ? undefined : value as 'venda' | 'aluguel' 
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-finalidade" />
                  <Label htmlFor="all-finalidade">Todas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="venda" id="venda" />
                  <Label htmlFor="venda">Venda</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aluguel" id="aluguel" />
                  <Label htmlFor="aluguel">Aluguel</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, status: value === 'all' ? undefined : value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="alugado">Alugado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cidade */}
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                placeholder="Digite a cidade"
                value={filters.cidade || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, cidade: e.target.value || undefined })
                }
              />
            </div>

            {/* Bairro */}
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                placeholder="Digite o bairro"
                value={filters.bairro || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, bairro: e.target.value || undefined })
                }
              />
            </div>

            {/* Faixa de Preço */}
            <div className="space-y-2">
              <Label>Faixa de Preço</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={filters.precoMin || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      precoMin: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={filters.precoMax || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      precoMax: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Botões */}
        <div className="flex flex-col gap-2 pt-4 border-t">
          <Button onClick={handleApply} className="w-full">
            Aplicar Filtros
          </Button>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full"
          >
            Limpar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
