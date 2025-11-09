import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types/database.types';
import { toast } from 'sonner';

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Usuario[];
    },
  });
}

export function useUsuario(userId?: string) {
  return useQuery({
    queryKey: ['usuario', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      // Se não encontrar usuário, tentar criar
      if (!data && !error) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert({
              auth_user_id: user.id,
              email: user.email,
              nome_completo: user.email?.split('@')[0] || 'Usuário',
              ativo: true,
            })
            .select()
            .single();
          
          if (insertError) throw insertError;
          return newUser as Usuario;
        }
      }

      if (error) throw error;
      return data as Usuario;
    },
    enabled: !!userId,
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Usuario> & { id: string }) => {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Usuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuario'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar perfil');
    },
  });
}

export function useUpdateUsuarioRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: 'admin' | 'corretor' | 'assistente' | 'supervisor';
    }) => {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Função atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar função');
    },
  });
}

export function useActivateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: 'admin' | 'corretor' | 'assistente' | 'supervisor';
    }) => {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ 
          role, 
          ativo: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Membro adicionado à equipe com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao adicionar membro à equipe');
    },
  });
}
