import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, User, Home, Star } from 'lucide-react';
import { useUpdateVisita } from '@/hooks/useVisitas';
import type { Visita } from '@/types/database.types';

interface VisitDetailModalProps {
  visit: Visita;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  agendada: { label: 'Agendada', variant: 'default' as const, color: 'bg-blue-500' },
  realizada: { label: 'Realizada', variant: 'default' as const, color: 'bg-green-500' },
  cancelada: { label: 'Cancelada', variant: 'destructive' as const, color: 'bg-red-500' },
};

export function VisitDetailModal({ visit, open, onOpenChange }: VisitDetailModalProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(visit.rating || 0);
  const [feedback, setFeedback] = useState(visit.feedback || '');
  const updateVisita = useUpdateVisita();

  const handleMarkAsCompleted = async () => {
    setShowFeedback(true);
  };

  const handleSaveFeedback = async () => {
    await updateVisita.mutateAsync({
      id: visit.id,
      status: 'realizada',
      feedback,
      rating,
    });
    onOpenChange(false);
  };

  const handleCancel = async () => {
    await updateVisita.mutateAsync({
      id: visit.id,
      status: 'cancelada',
    });
    onOpenChange(false);
  };

  const statusInfo = statusConfig[visit.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes da Visita</DialogTitle>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Lead</p>
                  <p className="font-semibold">{visit.lead?.nome}</p>
                  <p className="text-sm">{visit.lead?.telefone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Imóvel</p>
                  <p className="font-semibold">{visit.imovel?.tipo}</p>
                  <p className="text-sm">{visit.imovel?.endereco}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Data e Hora</p>
                  <p className="font-semibold">
                    {format(new Date(visit.data_hora), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm">{format(new Date(visit.data_hora), 'HH:mm', { locale: ptBR })}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-semibold">{visit.duracao || 60} minutos</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-semibold capitalize">{visit.tipo}</p>
                </div>
              </div>
            </div>
          </div>

          {visit.observacoes && (
            <>
              <Separator />
              <div>
                <Label className="text-sm text-muted-foreground">Observações</Label>
                <p className="mt-1">{visit.observacoes}</p>
              </div>
            </>
          )}

          {(visit.status === 'realizada' && visit.feedback) && (
            <>
              <Separator />
              <div>
                <Label className="text-sm text-muted-foreground">Avaliação</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (visit.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-3">{visit.feedback}</p>
              </div>
            </>
          )}

          {showFeedback && visit.status === 'agendada' && (
            <>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label>Avaliação da Visita</Label>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 cursor-pointer transition-colors ${
                          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Feedback</Label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Como foi a visita? O que o cliente achou do imóvel?"
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-end gap-3">
            {visit.status === 'agendada' && !showFeedback && (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar Visita
                </Button>
                <Button onClick={handleMarkAsCompleted}>Marcar como Realizada</Button>
              </>
            )}

            {showFeedback && (
              <Button onClick={handleSaveFeedback} disabled={updateVisita.isPending}>
                {updateVisita.isPending ? 'Salvando...' : 'Salvar Feedback'}
              </Button>
            )}

            {visit.status !== 'agendada' && (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
