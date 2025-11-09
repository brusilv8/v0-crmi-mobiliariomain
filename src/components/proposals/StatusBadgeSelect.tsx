import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useUpdatePropostaStatus } from '@/hooks/usePropostas';

interface StatusBadgeSelectProps {
  propostaId: string;
  currentStatus: string;
}

const statusConfig = {
  pendente: { label: 'Pendente', variant: 'secondary' as const },
  em_analise: { label: 'Em Análise', variant: 'default' as const },
  aceita: { label: 'Aceita', variant: 'default' as const },
  recusada: { label: 'Recusada', variant: 'destructive' as const },
  cancelada: { label: 'Cancelada', variant: 'outline' as const },
};

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aceita', label: 'Aceita' },
  { value: 'recusada', label: 'Recusada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export function StatusBadgeSelect({ propostaId, currentStatus }: StatusBadgeSelectProps) {
  const [open, setOpen] = useState(false);
  const updateStatus = useUpdatePropostaStatus();

  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pendente;

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus.mutateAsync({ id: propostaId, status: newStatus });
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent"
        >
          <Badge variant={statusInfo.variant} className="cursor-pointer hover:opacity-80">
            {statusInfo.label}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 bg-background">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            disabled={option.value === currentStatus}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
