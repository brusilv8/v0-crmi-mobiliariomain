import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Lead } from '@/types/database.types';
import { toast } from 'sonner';

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();

      if (error) throw error;

      // Get first funnel stage
      const { data: etapa, error: etapaError } = await supabase
        .from('funil_etapas')
        .select('id')
        .order('ordem', { ascending: true })
        .limit(1)
        .single();

      if (etapaError) throw etapaError;

      // Add to first funnel stage
      const { error: funilError } = await supabase
        .from('lead_funil')
        .insert({
          lead_id: data.id,
          etapa_id: etapa.id,
          data_entrada: new Date().toISOString()
        });

      if (funilError) throw funilError;

      // Create initial interaction
      await supabase.from('lead_interacoes').insert({
        lead_id: data.id,
        tipo: 'observacao',
        descricao: 'Lead criado no sistema'
      });

      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads_funil'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar lead');
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar lead');
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir lead');
    },
  });
}

export function useFinalizarLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('leads')
        .update({
          finalizado: true,
          data_finalizacao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Remove from funnel
      await supabase.from('lead_funil').delete().eq('lead_id', id);

      // Archive all active proposals from this lead
      await supabase
        .from('propostas')
        .update({ finalizada: true })
        .eq('lead_id', id)
        .eq('finalizada', false);

      // Create interaction
      await supabase.from('lead_interacoes').insert({
        lead_id: id,
        tipo: 'observacao',
        descricao: 'Lead marcado como finalizado e convertido em cliente',
      });

      // Register system activity
      const { data: lead } = await supabase
        .from('leads')
        .select('nome')
        .eq('id', id)
        .single();

      await supabase.from('atividades_sistema').insert({
        tipo: 'lead_finalizado',
        titulo: `Lead ${lead?.nome} foi finalizado`,
        descricao: 'Lead removido do funil e propostas arquivadas',
        lead_id: id,
      });

      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads_funil'] });
      toast.success('Lead finalizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao finalizar lead');
    },
  });
}

export function useReativarLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('leads')
        .update({
          finalizado: false,
          data_finalizacao: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Add back to first funnel stage
      const { data: etapa, error: etapaError } = await supabase
        .from('funil_etapas')
        .select('id')
        .order('ordem', { ascending: true })
        .limit(1)
        .single();

      if (etapaError) throw etapaError;

      await supabase.from('lead_funil').insert({
        lead_id: id,
        etapa_id: etapa.id,
        data_entrada: new Date().toISOString(),
      });

      // Create interaction
      await supabase.from('lead_interacoes').insert({
        lead_id: id,
        tipo: 'observacao',
        descricao: 'Cliente reativado no funil de vendas',
      });

      // Register system activity
      const { data: lead } = await supabase
        .from('leads')
        .select('nome')
        .eq('id', id)
        .single();

      await supabase.from('atividades_sistema').insert({
        tipo: 'lead_reativado',
        titulo: `Lead ${lead?.nome} foi reativado`,
        descricao: 'Lead retornou ao funil na primeira etapa',
        lead_id: id,
      });

      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads_funil'] });
      toast.success('Cliente reativado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao reativar cliente');
    },
  });
}
