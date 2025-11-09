import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, UserCheck, RotateCcw } from 'lucide-react';
import { LeadDetailModal } from '@/components/leads/LeadDetailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Lead } from '@/types/database.types';
import { Badge } from '@/components/ui/badge';
import { useReativarLead } from '@/hooks/useLeads';

export default function Customers() {
  const { data: leads, isLoading } = useLeads();
  const reativarLead = useReativarLead();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only finalized leads
  const clientes = leads?.filter((lead) => lead.finalizado) || [];

  const filteredClientes = clientes.filter((lead) =>
    lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.telefone?.includes(searchTerm)
  );

  const handleReativar = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja reativar este cliente no funil de vendas?')) {
      reativarLead.mutate(leadId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes Finalizados</h1>
          <p className="text-muted-foreground">
            Visualize e reative clientes que finalizaram negócios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold">{clientes.length}</span>
          <span className="text-muted-foreground">clientes</span>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Data Finalização</TableHead>
                <TableHead>Temperatura</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes && filteredClientes.length > 0 ? (
                filteredClientes.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {lead.email && (
                          <span className="text-sm text-muted-foreground">{lead.email}</span>
                        )}
                        <span className="text-sm">{lead.telefone}</span>
                      </div>
                    </TableCell>
                    <TableCell>{lead.origem}</TableCell>
                    <TableCell>
                      {lead.data_finalizacao
                        ? format(new Date(lead.data_finalizacao), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.temperatura === 'hot'
                            ? 'destructive'
                            : lead.temperatura === 'warm'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {lead.temperatura === 'hot'
                          ? 'Quente'
                          : lead.temperatura === 'warm'
                          ? 'Morno'
                          : 'Frio'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleReativar(lead.id, e)}
                        disabled={reativarLead.isPending}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum cliente finalizado encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <LeadDetailModal
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </div>
  );
}
