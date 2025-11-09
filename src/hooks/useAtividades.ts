import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AtividadeSistema } from "@/types/database.types";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useAtividades(limit: number = 15) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["atividades-sistema", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades_sistema")
        .select(`
          *,
          usuario:usuarios(id, nome_completo, avatar_url),
          lead:leads(id, nome),
          imovel:imoveis(id, endereco, tipo),
          proposta:propostas(id, codigo),
          visita:visitas(id, data_hora)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Erro ao buscar atividades:", error);
        throw error;
      }

      return data as AtividadeSistema[];
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos como fallback
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("atividades-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "atividades_sistema",
        },
        (payload) => {
          console.log("Nova atividade detectada:", payload);
          // Invalida a query para buscar novos dados
          queryClient.invalidateQueries({ queryKey: ["atividades-sistema"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
