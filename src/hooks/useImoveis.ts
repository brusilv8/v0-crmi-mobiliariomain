import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Imovel } from '@/types/database.types';
import { toast } from 'sonner';

export function useImoveis() {
  return useQuery({
    queryKey: ['imoveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Imovel[];
    },
  });
}

export function useImovel(id: string) {
  return useQuery({
    queryKey: ['imoveis', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Imovel;
    },
    enabled: !!id,
  });
}

export function useCreateImovel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imovel: Omit<Imovel, 'id' | 'created_at'>) => {
      console.log('🏠 Hook useCreateImovel chamado');
      console.log('📋 Payload:', imovel);
      
      const { data, error } = await supabase
        .from('imoveis')
        .insert(imovel)
        .select()
        .single();

      console.log('🔍 Resposta Supabase:', { data, error });

      if (error) throw error;
      return data as Imovel;
    },
    onSuccess: () => {
      console.log('✅ onSuccess - Imóvel criado');
      queryClient.invalidateQueries({ queryKey: ['imoveis'] });
      toast.success('Imóvel criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ onError:', error);
      toast.error(error.message || 'Erro ao criar imóvel');
    },
  });
}

export function useUpdateImovel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Imovel> & { id: string }) => {
      const { data, error } = await supabase
        .from('imoveis')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Imovel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imoveis'] });
      toast.success('Imóvel atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar imóvel');
    },
  });
}

export function useDeleteImovel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete related records if needed
      // Then delete the property
      const { error } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imoveis'] });
      toast.success('Imóvel excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir imóvel');
    },
  });
}
