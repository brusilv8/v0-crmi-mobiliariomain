import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FunilEtapa, LeadFunil } from '@/types/database.types';
import { toast } from 'sonner';

export function useFunilEtapas() {
  return useQuery({
    queryKey: ['funil_etapas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funil_etapas')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as FunilEtapa[];
    },
  });
}

export function useLeadsFunil() {
  return useQuery({
    queryKey: ['leads_funil'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_funil')
        .select(`
          *,
          lead:leads!inner(*),
          etapa:funil_etapas(*)
        `)
        .eq('lead.finalizado', false)
        .order('data_entrada', { ascending: false });

      if (error) throw error;
      return data as LeadFunil[];
    },
  });
}

export function useUpdateLeadEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, etapaId }: { leadId: string; etapaId: string }) => {
      // Delete existing
      await supabase
        .from('lead_funil')
        .delete()
        .eq('lead_id', leadId);

      // Insert new
      const { data, error } = await supabase
        .from('lead_funil')
        .insert({
          lead_id: leadId,
          etapa_id: etapaId,
          data_entrada: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create interaction
      await supabase.from('lead_interacoes').insert({
        lead_id: leadId,
        tipo: 'observacao',
        descricao: 'Lead movido no funil'
      });

      // Register system activity
      const { data: lead } = await supabase
        .from('leads')
        .select('nome')
        .eq('id', leadId)
        .single();

      const { data: novaEtapa } = await supabase
        .from('funil_etapas')
        .select('nome')
        .eq('id', etapaId)
        .single();

      if (novaEtapa) {
        await supabase.from('atividades_sistema').insert({
          tipo: 'etapa_alterada',
          titulo: `${lead?.nome || 'Lead'} movido para ${novaEtapa.nome}`,
          descricao: `Lead avançou no funil de vendas`,
          lead_id: leadId,
          metadata: { 
            etapa_nova: novaEtapa.nome 
          }
        });
      }

      // Update last contact
      await supabase
        .from('leads')
        .update({ ultimo_contato: new Date().toISOString() })
        .eq('id', leadId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads_funil'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead movido no funil!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao mover lead');
    },
  });
}

export function useSyncLeadsToFunil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get all leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id');

      if (leadsError) throw leadsError;

      // Get all leads already in funnel
      const { data: leadsFunil, error: funilError } = await supabase
        .from('lead_funil')
        .select('lead_id');

      if (funilError) throw funilError;

      const leadIdsInFunil = new Set(leadsFunil?.map((lf) => lf.lead_id) || []);
      const leadsToAdd = leads?.filter((lead) => !leadIdsInFunil.has(lead.id)) || [];

      if (leadsToAdd.length === 0) {
        return { synced: 0 };
      }

      // Get first funnel stage
      const { data: etapa, error: etapaError } = await supabase
        .from('funil_etapas')
        .select('id')
        .order('ordem', { ascending: true })
        .limit(1)
        .single();

      if (etapaError) throw etapaError;

      // Add all leads to first stage
      const { error: insertError } = await supabase
        .from('lead_funil')
        .insert(
          leadsToAdd.map((lead) => ({
            lead_id: lead.id,
            etapa_id: etapa.id,
            data_entrada: new Date().toISOString()
          }))
        );

      if (insertError) throw insertError;

      return { synced: leadsToAdd.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads_funil'] });
      if (data.synced > 0) {
        toast.success(`${data.synced} lead(s) sincronizado(s) com sucesso!`);
      } else {
        toast.info('Todos os leads já estão no funil');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sincronizar leads');
    },
  });
}
