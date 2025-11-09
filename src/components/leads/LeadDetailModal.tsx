import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUpdateLead, useDeleteLead } from "@/hooks/useLeads";
import { useState } from "react";
import { 
  Phone, Mail, MapPin, DollarSign, Tag, Clock, 
  Edit2, Save, X, User, Flame, Sun, Snowflake, Trash2
} from "lucide-react";
import type { Lead, LeadInteracao } from "@/types/database.types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { FinalizarLeadButton } from "./FinalizarLeadButton";

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const temperaturaConfig = {
  hot: { icon: Flame, color: "text-destructive", label: "Quente" },
  warm: { icon: Sun, color: "text-warning", label: "Morno" },
  cold: { icon: Snowflake, color: "text-primary", label: "Frio" },
};

export function LeadDetailModal({ lead, open, onOpenChange }: LeadDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const { data: interacoes } = useQuery({
    queryKey: ['lead_interacoes', lead?.id],
    queryFn: async () => {
      if (!lead?.id) return [];
      const { data, error } = await supabase
        .from('lead_interacoes')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LeadInteracao[];
    },
    enabled: !!lead?.id && open,
  });

  if (!lead) return null;

  const tempConfig = temperaturaConfig[lead.temperatura];
  const TempIcon = tempConfig.icon;

  const handleSave = () => {
    if (Object.keys(editedLead).length > 0) {
      updateLead.mutate(
        { id: lead.id, ...editedLead },
        {
          onSuccess: () => {
            setIsEditing(false);
            setEditedLead({});
          },
        }
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedLead({});
  };

  const getValue = (field: keyof Lead) => {
    return editedLead[field] !== undefined ? editedLead[field] : lead[field];
  };

  const handleDelete = () => {
    deleteLead.mutate(lead.id, {
      onSuccess: () => {
        onOpenChange(false);
        setShowDeleteDialog(false);
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl">{lead.nome}</DialogTitle>
                <Badge variant="outline" className={tempConfig.color}>
                  <TempIcon className="w-3 h-3 mr-1" />
                  {tempConfig.label}
                </Badge>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    {!lead.finalizado && (
                      <FinalizarLeadButton
                        leadId={lead.id}
                        leadNome={lead.nome}
                        onSuccess={() => onOpenChange(false)}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="gap-2"
                      disabled={updateLead.isPending}
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    {isEditing ? (
                      <Input
                        value={getValue('nome') as string}
                        onChange={(e) =>
                          setEditedLead({ ...editedLead, nome: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{lead.nome}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Telefone</Label>
                    {isEditing ? (
                      <Input
                        value={getValue('telefone') as string}
                        onChange={(e) =>
                          setEditedLead({ ...editedLead, telefone: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{lead.telefone}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={(getValue('email') as string) || ''}
                        onChange={(e) =>
                          setEditedLead({ ...editedLead, email: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{lead.email || 'Não informado'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Origem</Label>
                    {isEditing ? (
                      <Input
                        value={getValue('origem') as string}
                        onChange={(e) =>
                          setEditedLead({ ...editedLead, origem: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span>{lead.origem}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Interesse</Label>
                  {isEditing ? (
                    <Textarea
                      value={(getValue('interesse') as string) || ''}
                      onChange={(e) =>
                        setEditedLead({ ...editedLead, interesse: e.target.value })
                      }
                      rows={2}
                    />
                  ) : (
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                      <span>{lead.interesse || 'Não informado'}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Orçamento Mínimo</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {lead.orcamento_min?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }) || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>Orçamento Máximo</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {lead.orcamento_max?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }) || 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>

                {lead.observacoes && (
                  <>
                    <Separator />
                    <div>
                      <Label>Observações</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lead.observacoes}
                      </p>
                    </div>
                  </>
                )}

                {lead.tags && lead.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {lead.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-3 mt-4">
              {interacoes && interacoes.length > 0 ? (
                interacoes.map((interacao) => (
                  <Card key={interacao.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{interacao.tipo}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(interacao.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                    <p className="text-sm">{interacao.descricao}</p>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma interação registrada ainda
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{lead.nome}</strong>? Esta ação não pode ser desfeita e irá remover todas as informações relacionadas (visitas, propostas e atividades).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLead.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
