import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Proposta } from '@/types/database.types';
import { toast } from 'sonner';

export function usePropostas() {
  return useQuery({
    queryKey: ['propostas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propostas')
        .select(`
          *,
          lead:leads(*),
          imovel:imoveis(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Proposta[];
    },
  });
}

export function useCreateProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proposta: Omit<Proposta, 'id' | 'created_at' | 'codigo'>) => {
      // Generate codigo
      const codigo = `PROP-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('propostas')
        .insert({ ...proposta, codigo })
        .select()
        .single();

      if (error) throw error;

      // Get lead name for activity
      const { data: lead } = await supabase
        .from('leads')
        .select('nome')
        .eq('id', proposta.lead_id)
        .single();

      // Create interaction
      await supabase.from('lead_interacoes').insert({
        lead_id: proposta.lead_id,
        tipo: 'proposta',
        descricao: `Proposta ${codigo} criada no valor de ${proposta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      });

      // Register system activity
      await supabase.from('atividades_sistema').insert({
        tipo: 'proposta_criada',
        titulo: `Nova proposta ${codigo} criada`,
        descricao: lead?.nome ? `Lead: ${lead.nome} - Valor: ${proposta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : undefined,
        proposta_id: data.id,
        lead_id: proposta.lead_id,
      });

      return data as Proposta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-sistema'] });
      toast.success('Proposta criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar proposta');
    },
  });
}

export function useUpdateProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Proposta> & { id: string }) => {
      const { data, error } = await supabase
        .from('propostas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Proposta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar proposta');
    },
  });
}

export function useDeleteProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('propostas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir proposta');
    },
  });
}

export function useUpdatePropostaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Get proposta details first
      const { data: proposta } = await supabase
        .from('propostas')
        .select('*, lead:leads(nome)')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('propostas')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Register system activity for status change
      await supabase.from('atividades_sistema').insert({
        tipo: 'proposta_status_alterado',
        titulo: `Proposta ${proposta?.codigo} mudou para ${status}`,
        descricao: proposta?.lead?.nome ? `Lead: ${proposta.lead.nome}` : undefined,
        proposta_id: id,
        lead_id: proposta?.lead_id,
        metadata: { status_novo: status }
      });

      return data as Proposta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-sistema'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
}
