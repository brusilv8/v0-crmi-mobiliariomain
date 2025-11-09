import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  BedDouble,
  Bath,
  Car,
  Square,
  Home,
  Building2,
  DollarSign,
  Trash2,
  Edit,
} from "lucide-react";
import { useDeleteImovel } from "@/hooks/useImoveis";
import { PropertyFormModal } from "./PropertyFormModal";
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

interface PropertyDetailModalProps {
  property: Imovel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDetailModal({ property, open, onOpenChange }: PropertyDetailModalProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const deleteImovel = useDeleteImovel();

  if (!property) return null;

  const valor = property.finalidade === 'venda' ? property.valor_venda : property.valor_aluguel;
  const valorFormatado = valor ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'A consultar';

  const handleDelete = async () => {
    try {
      await deleteImovel.mutateAsync(property.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir imóvel:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Imóvel</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-8rem)]">
            <div className="space-y-6">
              {/* Imagem */}
              <div className="relative h-64 rounded-lg overflow-hidden bg-muted">
                {property.imagem_principal ? (
                  <img 
                    src={property.imagem_principal} 
                    alt={`${property.tipo} - ${property.endereco}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                <Badge className={`absolute top-4 right-4 ${statusColors[property.status]}`}>
                  {statusLabels[property.status]}
                </Badge>
              </div>

              {/* Tipo e Finalidade */}
              <div>
                <Badge variant="outline" className="mb-2">
                  {property.tipo} • {property.finalidade === 'venda' ? 'Venda' : 'Aluguel'}
                </Badge>
                <h3 className="text-2xl font-bold mb-2">
                  {property.tipo} em {property.bairro}
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {property.endereco}
                    {property.numero && `, ${property.numero}`}
                    {property.complemento && ` - ${property.complemento}`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {property.bairro}, {property.cidade} - {property.estado}, CEP: {property.cep}
                </p>
              </div>

              <Separator />

              {/* Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    {property.finalidade === 'venda' ? 'Valor de Venda' : 'Valor do Aluguel'}
                  </p>
                  <p className="text-2xl font-bold text-primary">{valorFormatado}</p>
                </div>
                {property.valor_condominio && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Condomínio</p>
                    <p className="text-lg font-semibold">
                      {property.valor_condominio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                )}
                {property.valor_iptu && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">IPTU</p>
                    <p className="text-lg font-semibold">
                      {property.valor_iptu.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Características */}
              <div>
                <h4 className="font-semibold mb-3">Características</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <BedDouble className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">{property.quartos || 0}</span>
                    <span className="text-xs text-muted-foreground">Quartos</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Bath className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">{property.banheiros || 0}</span>
                    <span className="text-xs text-muted-foreground">Banheiros</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Car className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">{property.vagas || 0}</span>
                    <span className="text-xs text-muted-foreground">Vagas</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Square className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">{property.area_util || 0}</span>
                    <span className="text-xs text-muted-foreground">m²</span>
                  </div>
                </div>

                {property.area_total && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Área Total: {property.area_total}m²
                  </div>
                )}
              </div>

              {/* Descrição */}
              {property.descricao && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Descrição</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{property.descricao}</p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita e removerá todas as informações relacionadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteImovel.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PropertyFormModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        property={property}
      />
    </>
  );
}
