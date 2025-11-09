import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, User, Home, Calendar, DollarSign, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { useDeleteProposta } from '@/hooks/usePropostas';
import { StatusBadgeSelect } from './StatusBadgeSelect';
import { cn } from '@/lib/utils';
import type { Proposta } from '@/types/database.types';

interface ProposalDetailModalProps {
  proposal: Proposta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (proposta: Proposta) => void;
}

const statusConfig = {
  pendente: { label: 'Pendente', variant: 'secondary' as const, color: 'bg-gray-500' },
  em_analise: { label: 'Em Análise', variant: 'default' as const, color: 'bg-yellow-500' },
  aceita: { label: 'Aceita', variant: 'default' as const, color: 'bg-green-500' },
  recusada: { label: 'Recusada', variant: 'destructive' as const, color: 'bg-red-500' },
  cancelada: { label: 'Cancelada', variant: 'outline' as const, color: 'bg-gray-400' },
};

export function ProposalDetailModal({ proposal, open, onOpenChange, onEdit }: ProposalDetailModalProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteProposta = useDeleteProposta();
  const statusInfo = statusConfig[proposal.status as keyof typeof statusConfig] || statusConfig.pendente;

  const handleDelete = async () => {
    await deleteProposta.mutateAsync(proposal.id);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const handleEdit = () => {
    onEdit?.(proposal);
  };

  // Não permite editar/excluir se aceita
  const isEditable = proposal.status !== 'aceita';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Proposta {proposal.codigo}
            </DialogTitle>
            <StatusBadgeSelect propostaId={proposal.id} currentStatus={proposal.status} />
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lead</p>
                    <p className="font-semibold">{proposal.lead?.nome}</p>
                    <p className="text-sm">{proposal.lead?.telefone}</p>
                    {proposal.lead?.email && <p className="text-sm">{proposal.lead.email}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Imóvel</p>
                    <p className="font-semibold">{proposal.imovel?.tipo}</p>
                    <p className="text-sm">{proposal.imovel?.endereco}</p>
                    <p className="text-sm">
                      {proposal.imovel?.cidade} - {proposal.imovel?.estado}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor da Proposta</p>
                    <p className="text-2xl font-bold text-primary">
                      {proposal.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Validade</p>
                    <p className="font-semibold">
                      {format(new Date(proposal.validade), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Condições Financeiras</h4>
              <div className="grid grid-cols-3 gap-4">
                {proposal.valor_entrada && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Entrada</p>
                    <p className="font-semibold">
                      {proposal.valor_entrada.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                )}

                {proposal.num_parcelas && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Parcelas</p>
                    <p className="font-semibold">{proposal.num_parcelas}x</p>
                  </div>
                )}

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">FGTS</p>
                  <p className="font-semibold">{proposal.usa_fgts ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </div>

            {proposal.condicoes_especiais && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Condições Especiais</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {proposal.condicoes_especiais}
                  </p>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Criada em {format(new Date(proposal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', statusInfo.color)}>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-0.5 h-full bg-border mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-semibold">Proposta Criada</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(proposal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-sm mt-1">
                    Proposta {proposal.codigo} criada no valor de{' '}
                    {proposal.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>

              {proposal.updated_at && proposal.updated_at !== proposal.created_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', statusInfo.color)}>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Status Atualizado</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(proposal.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm mt-1">
                      Status alterado para <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleEdit}
            disabled={!isEditable}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Proposta
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={!isEditable}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Proposta
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a proposta {proposal.codigo}? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
