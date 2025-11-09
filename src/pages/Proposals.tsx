import { useState } from 'react';
import { usePropostas } from '@/hooks/usePropostas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';
import { ProposalFormModal } from '@/components/proposals/ProposalFormModal';
import { ProposalDetailModal } from '@/components/proposals/ProposalDetailModal';
import { StatusBadgeSelect } from '@/components/proposals/StatusBadgeSelect';
import { LeadDetailModal } from '@/components/leads/LeadDetailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Proposta, Lead } from '@/types/database.types';

export default function Proposals() {
  const { data: propostas, isLoading } = usePropostas();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProposta, setEditingProposta] = useState<Proposta | null>(null);
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPropostas = propostas?.filter((proposta) => {
    // Only show active proposals from active leads
    const isActive = !proposta.lead?.finalizado && !proposta.finalizada;
    
    const matchesSearch =
      proposta.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.lead?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || proposta.status === statusFilter;
    
    return isActive && matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold">Propostas</h1>
          <p className="text-muted-foreground">Gerencie suas propostas comerciais</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Proposta
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por código ou lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="aceita">Aceita</SelectItem>
              <SelectItem value="recusada">Recusada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPropostas && filteredPropostas.length > 0 ? (
                filteredPropostas.map((proposta) => {
                  return (
                    <TableRow 
                      key={proposta.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedProposta(proposta)}
                    >
                      <TableCell className="font-medium">{proposta.codigo || 'N/A'}</TableCell>
                      <TableCell 
                        className="text-primary hover:underline cursor-pointer font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (proposta.lead) setSelectedLead(proposta.lead as Lead);
                        }}
                      >
                        {proposta.lead?.nome || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {proposta.imovel?.tipo || 'N/A'} - {proposta.imovel?.endereco || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {proposta.valor?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }) || 'R$ 0,00'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <StatusBadgeSelect 
                          propostaId={proposta.id} 
                          currentStatus={proposta.status} 
                        />
                      </TableCell>
                      <TableCell>
                        {proposta.validade ? format(new Date(proposta.validade), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground text-sm">Ver detalhes →</div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma proposta encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ProposalFormModal 
        open={isFormOpen || !!editingProposta} 
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingProposta(null);
        }}
        proposta={editingProposta}
      />

      {selectedProposta && (
        <ProposalDetailModal
          proposal={selectedProposta}
          open={!!selectedProposta}
          onOpenChange={() => setSelectedProposta(null)}
          onEdit={(proposta) => {
            setEditingProposta(proposta);
            setSelectedProposta(null);
          }}
        />
      )}

      <LeadDetailModal
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </div>
  );
}
