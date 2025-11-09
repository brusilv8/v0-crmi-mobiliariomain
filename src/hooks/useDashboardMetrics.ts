import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // Total leads ativos (não finalizados)
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('finalizado', false);

      // Visitas hoje
      const today = new Date().toISOString().split('T')[0];
      const { count: visitasHoje } = await supabase
        .from('visitas')
        .select('*', { count: 'exact', head: true })
        .gte('data_hora', today)
        .lt('data_hora', `${today}T23:59:59`)
        .eq('status', 'agendada');

      // Propostas em análise (não finalizadas)
      const { count: propostasAnalise } = await supabase
        .from('propostas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'em_analise')
        .eq('finalizada', false);

      // Taxa de conversão geral: propostas aceitas / total de leads ativos
      const { count: propostasAceitas } = await supabase
        .from('propostas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aceita')
        .eq('finalizada', false);

      const taxaConversaoGeral = totalLeads && totalLeads > 0 
        ? ((propostasAceitas || 0) / totalLeads * 100).toFixed(1)
        : '0';

      // Leads por origem (ativos)
      const { data: leadsPorOrigem } = await supabase
        .from('leads')
        .select('origem')
        .eq('finalizado', false);

      const origemCounts: Record<string, number> = {};
      leadsPorOrigem?.forEach(lead => {
        origemCounts[lead.origem] = (origemCounts[lead.origem] || 0) + 1;
      });

      // Calcular conversão entre etapas do funil
      const { data: etapas } = await supabase
        .from('funil_etapas')
        .select('id, nome, ordem')
        .order('ordem', { ascending: true });

      let conversaoEtapas: Array<{etapa: string, conversao: number}> = [];
      
      if (etapas && etapas.length > 1) {
        for (let i = 0; i < etapas.length - 1; i++) {
          const etapaAtual = etapas[i];
          const proximaEtapa = etapas[i + 1];

          // Contar leads na etapa atual
          const { count: leadsEtapaAtual } = await supabase
            .from('lead_funil')
            .select('*', { count: 'exact', head: true })
            .eq('etapa_id', etapaAtual.id);

          // Contar leads na próxima etapa
          const { count: leadsProximaEtapa } = await supabase
            .from('lead_funil')
            .select('*', { count: 'exact', head: true })
            .eq('etapa_id', proximaEtapa.id);

          const conversao = leadsEtapaAtual && leadsEtapaAtual > 0
            ? ((leadsProximaEtapa || 0) / leadsEtapaAtual * 100).toFixed(1)
            : '0';

          conversaoEtapas.push({
            etapa: `${etapaAtual.nome} → ${proximaEtapa.nome}`,
            conversao: parseFloat(conversao)
          });
        }
      }

      return {
        totalLeads: totalLeads || 0,
        visitasHoje: visitasHoje || 0,
        propostasAnalise: propostasAnalise || 0,
        taxaConversao: parseFloat(taxaConversaoGeral),
        conversaoEtapas,
        leadsPorOrigem: Object.entries(origemCounts).map(([origem, total]) => ({
          origem,
          total
        }))
      };
    },
    refetchInterval: 60000, // Auto-refresh every 60s
  });
}

export function useFunnelData() {
  return useQuery({
    queryKey: ['funnel-data'],
    queryFn: async () => {
      const { data: etapas } = await supabase
        .from('funil_etapas')
        .select('*')
        .order('ordem', { ascending: true });

      if (!etapas) return [];

      const funnelData = await Promise.all(
        etapas.map(async (etapa, index) => {
          const { count } = await supabase
            .from('lead_funil')
            .select('*', { count: 'exact', head: true })
            .eq('etapa_id', etapa.id);

          // Calcular conversão da etapa anterior para esta
          let conversao = null;
          if (index > 0) {
            const etapaAnterior = etapas[index - 1];
            const { count: countAnterior } = await supabase
              .from('lead_funil')
              .select('*', { count: 'exact', head: true })
              .eq('etapa_id', etapaAnterior.id);

            if (countAnterior && countAnterior > 0) {
              conversao = ((count || 0) / countAnterior * 100).toFixed(1);
            }
          }

          return {
            name: etapa.nome,
            value: count || 0,
            color: etapa.cor,
            conversao: conversao ? parseFloat(conversao) : null
          };
        })
      );

      return funnelData;
    },
    refetchInterval: 60000,
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lead_interacoes')
        .select(`
          *,
          lead:leads(nome),
          usuario:usuarios(nome_completo)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    },
    refetchInterval: 60000,
  });
}
