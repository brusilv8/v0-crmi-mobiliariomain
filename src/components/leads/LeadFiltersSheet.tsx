import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface LeadFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    temperatura?: string;
    origem?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function LeadFiltersSheet({ open, onOpenChange, filters, onFiltersChange }: LeadFiltersSheetProps) {
  const hasActiveFilters = Object.values(filters).some(v => v);

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filtros Avançados</SheetTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 gap-1"
              >
                <X className="w-3 h-3" />
                Limpar
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label>Temperatura</Label>
            <Select
              value={filters.temperatura || "todos"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  temperatura: value === "todos" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="hot">🔥 Quente</SelectItem>
                <SelectItem value="warm">☀️ Morno</SelectItem>
                <SelectItem value="cold">❄️ Frio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Origem</Label>
            <Select
              value={filters.origem || "todos"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  origem: value === "todos" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Site">Site</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Indicação">Indicação</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Filtros ativos:
              </Label>
              <div className="flex flex-wrap gap-2">
                {filters.temperatura && (
                  <Badge variant="secondary" className="gap-1">
                    Temperatura: {filters.temperatura}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        onFiltersChange({ ...filters, temperatura: undefined })
                      }
                    />
                  </Badge>
                )}
                {filters.origem && (
                  <Badge variant="secondary" className="gap-1">
                    Origem: {filters.origem}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        onFiltersChange({ ...filters, origem: undefined })
                      }
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
