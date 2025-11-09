import { useState, useMemo } from 'react';
import { usePropostas } from '@/hooks/usePropostas';
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
import { Search, FileText } from 'lucide-react';
import { ProposalDetailModal } from '@/components/proposals/ProposalDetailModal';
import { LeadDetailModal } from '@/components/leads/LeadDetailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Proposta, Lead } from '@/types/database.types';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  pendente: { label: 'Pendente', variant: 'outline' as const, color: 'text-yellow-600' },
  em_analise: { label: 'Em Análise', variant: 'default' as const, color: 'text-blue-600' },
  aceita: { label: 'Aceita', variant: 'default' as const, color: 'text-green-600' },
  recusada: { label: 'Recusada', variant: 'destructive' as const, color: 'text-red-600' },
  cancelada: { label: 'Cancelada', variant: 'secondary' as const, color: 'text-gray-600' },
};

export default function ProposalHistory() {
  const { data: propostas, isLoading } = usePropostas();
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leadFilter, setLeadFilter] = useState<string>('all');

  // Get unique leads for filter
  const uniqueLeads = useMemo(() => {
    if (!propostas) return [];
    const leadsMap = new Map();
    propostas.forEach((p) => {
      if (p.lead && p.lead.id) {
        leadsMap.set(p.lead.id, p.lead);
      }
    });
    return Array.from(leadsMap.values());
  }, [propostas]);

  const filteredPropostas = propostas?.filter((proposta) => {
    const matchesSearch =
      proposta.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.lead?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.imovel?.endereco?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || proposta.status === statusFilter;
    const matchesLead = leadFilter === 'all' || proposta.lead_id === leadFilter;

    return matchesSearch && matchesStatus && matchesLead;
  });

  // Group by status for stats
  const stats = useMemo(() => {
    if (!propostas) return { total: 0, aceitas: 0, recusadas: 0, pendentes: 0 };
    return {
      total: propostas.length,
      aceitas: propostas.filter((p) => p.status === 'aceita').length,
      recusadas: propostas.filter((p) => p.status === 'recusada').length,
      pendentes: propostas.filter((p) => p.status === 'pendente' || p.status === 'em_analise').length,
    };
  }, [propostas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de Propostas</h1>
        <p className="text-muted-foreground">Consulte todas as propostas já realizadas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <div className="text-2xl font-bold mt-2">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">Aceitas</span>
          </div>
          <div className="text-2xl font-bold mt-2 text-green-600">{stats.aceitas}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">Recusadas</span>
          </div>
          <div className="text-2xl font-bold mt-2 text-red-600">{stats.recusadas}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-muted-foreground">Pendentes</span>
          </div>
          <div className="text-2xl font-bold mt-2 text-yellow-600">{stats.pendentes}</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por código, lead ou imóvel..."
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
          <Select value={leadFilter} onValueChange={setLeadFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Leads</SelectItem>
              {uniqueLeads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.nome}
                </SelectItem>
              ))}
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
                <TableHead>Data Criação</TableHead>
                <TableHead>Validade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPropostas && filteredPropostas.length > 0 ? (
                filteredPropostas.map((proposta) => {
                  const config = statusConfig[proposta.status] || statusConfig.pendente;
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
                      <TableCell className="max-w-[200px] truncate">
                        {proposta.imovel?.tipo || 'N/A'} - {proposta.imovel?.endereco || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {proposta.valor?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }) || 'R$ 0,00'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className={config.color}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {proposta.created_at
                          ? format(new Date(proposta.created_at), 'dd/MM/yyyy', { locale: ptBR })
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {proposta.validade
                          ? format(new Date(proposta.validade), 'dd/MM/yyyy', { locale: ptBR })
                          : 'N/A'}
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

      {selectedProposta && (
        <ProposalDetailModal
          proposal={selectedProposta}
          open={!!selectedProposta}
          onOpenChange={() => setSelectedProposta(null)}
          onEdit={() => {}}
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
