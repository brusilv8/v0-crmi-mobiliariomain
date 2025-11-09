import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { useFinalizarLead } from '@/hooks/useLeads';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FinalizarLeadButtonProps {
  leadId: string;
  leadNome: string;
  onSuccess?: () => void;
}

export function FinalizarLeadButton({ leadId, leadNome, onSuccess }: FinalizarLeadButtonProps) {
  const finalizarLead = useFinalizarLead();

  const handleFinalizar = () => {
    finalizarLead.mutate(leadId, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <UserCheck className="h-4 w-4" />
          Finalizar e Converter em Cliente
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finalizar Lead</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja marcar <strong>{leadNome}</strong> como finalizado e convertê-lo em cliente?
            <br />
            <br />
            Esta ação irá:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remover o lead do funil de vendas principal</li>
              <li>Movê-lo para a área de Clientes</li>
              <li>Manter todo o histórico de propostas e interações</li>
            </ul>
            <br />
            Você poderá reativar o cliente a qualquer momento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleFinalizar} disabled={finalizarLead.isPending}>
            {finalizarLead.isPending ? 'Finalizando...' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
