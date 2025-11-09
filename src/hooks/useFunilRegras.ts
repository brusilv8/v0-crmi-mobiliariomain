import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FunilRegraTransicao } from '@/types/database.types';
import { toast } from 'sonner';

export function useFunilRegras() {
  return useQuery({
    queryKey: ['funil_regras_transicao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funil_regras_transicao')
        .select(`
          *,
          etapa_origem:funil_etapas!funil_regras_transicao_etapa_origem_id_fkey(*),
          etapa_destino:funil_etapas!funil_regras_transicao_etapa_destino_id_fkey(*)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as FunilRegraTransicao[];
    },
  });
}

export function useCreateOrUpdateRegra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (regra: Omit<FunilRegraTransicao, 'id' | 'created_at' | 'updated_at' | 'etapa_origem' | 'etapa_destino'>) => {
      // Verificar se já existe uma regra para essa transição
      const { data: existing } = await supabase
        .from('funil_regras_transicao')
        .select('id')
        .eq('etapa_origem_id', regra.etapa_origem_id)
        .eq('etapa_destino_id', regra.etapa_destino_id)
        .maybeSingle();

      if (existing) {
        // Atualizar regra existente
        const { data, error } = await supabase
          .from('funil_regras_transicao')
          .update({
            pode_transitar: regra.pode_transitar,
            observacao: regra.observacao,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as FunilRegraTransicao;
      } else {
        // Criar nova regra
        const { data, error } = await supabase
          .from('funil_regras_transicao')
          .insert(regra)
          .select()
          .single();

        if (error) throw error;
        return data as FunilRegraTransicao;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funil_regras_transicao'] });
      toast.success('Regra de transição salva com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar regra');
    },
  });
}

export function useDeleteRegra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funil_regras_transicao')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funil_regras_transicao'] });
      toast.success('Regra removida com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover regra');
    },
  });
}

export function useBulkUpdateRegras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (regras: Array<Omit<FunilRegraTransicao, 'id' | 'created_at' | 'updated_at' | 'etapa_origem' | 'etapa_destino'>>) => {
      // Deletar todas as regras existentes
      await supabase.from('funil_regras_transicao').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Inserir novas regras
      if (regras.length > 0) {
        const { error } = await supabase
          .from('funil_regras_transicao')
          .insert(regras);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funil_regras_transicao'] });
      toast.success('Regras atualizadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar regras');
    },
  });
}
