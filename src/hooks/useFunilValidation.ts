import { useMemo } from 'react';
import { useFunilEtapas } from './useFunilEtapas';
import { useFunilRegras } from './useFunilRegras';
import type { FunilEtapa, LeadFunil } from '@/types/database.types';

export function useFunilValidation() {
  const { data: etapas } = useFunilEtapas();
  const { data: regrasCustomizadas } = useFunilRegras();

  const etapasMap = useMemo(() => {
    if (!etapas) return new Map<string, FunilEtapa & { ordem: number }>();
    return new Map(etapas.map(e => [e.id, e]));
  }, [etapas]);

  const getEtapaNome = (etapaId: string): string => {
    return etapasMap.get(etapaId)?.nome || '';
  };

  const getEtapaOrdem = (etapaId: string): number => {
    return etapasMap.get(etapaId)?.ordem || 0;
  };

  // Verifica se pode mover de uma etapa para outra
  const canMoveToEtapa = (fromEtapaId: string, toEtapaId: string): { valid: boolean; message?: string } => {
    const fromOrdem = getEtapaOrdem(fromEtapaId);
    const toOrdem = getEtapaOrdem(toEtapaId);
    
    if (fromEtapaId === toEtapaId) {
      return { valid: false, message: 'Lead já está nesta etapa' };
    }

    // Verificar se existe regra customizada para esta transição
    const regraCustomizada = regrasCustomizadas?.find(
      r => r.etapa_origem_id === fromEtapaId && r.etapa_destino_id === toEtapaId
    );

    if (regraCustomizada) {
      // Usar regra customizada
      if (!regraCustomizada.pode_transitar) {
        const motivo = regraCustomizada.observacao || 'Esta transição foi bloqueada pelas regras do sistema.';
        return { valid: false, message: motivo };
      }
      return { valid: true };
    }

    // Aplicar regras padrão se não houver regra customizada
    // Permite voltar etapas livremente
    if (toOrdem < fromOrdem) {
      return { valid: true };
    }

    // Bloqueia pular etapas ao avançar (comportamento padrão)
    if (toOrdem > fromOrdem + 1) {
      return { 
        valid: false, 
        message: 'Não é permitido pular etapas. Avance sequencialmente.' 
      };
    }

    return { valid: true };
  };

  // Verifica se lead pode ter visita agendada (Qualificação ou superior)
  const canScheduleVisit = (leadFunil: LeadFunil | null): { valid: boolean; message?: string } => {
    if (!leadFunil || !leadFunil.etapa_id) {
      return { valid: false, message: 'Lead não encontrado no funil' };
    }

    const etapaAtual = etapasMap.get(leadFunil.etapa_id);
    if (!etapaAtual) {
      return { valid: false, message: 'Etapa do lead não encontrada' };
    }

    // Qualificação geralmente é a 3ª etapa (ordem 2 começando do 0)
    // Vamos usar o nome para garantir
    const etapaNome = etapaAtual.nome.toLowerCase();
    const ordem = etapaAtual.ordem;

    // Define etapas mínimas: Qualificação ou superior
    const qualificacaoEtapa = Array.from(etapasMap.values()).find(
      e => e.nome.toLowerCase().includes('qualif')
    );
    const minOrdem = qualificacaoEtapa?.ordem || 2;

    if (ordem < minOrdem) {
      return { 
        valid: false, 
        message: "Este lead precisa estar pelo menos em 'Qualificação' para agendar visita." 
      };
    }

    return { valid: true };
  };

  // Verifica se lead pode ter proposta criada (Qualificação, Visita Agendada ou superior)
  const canCreateProposal = (leadFunil: LeadFunil | null): { valid: boolean; message?: string } => {
    if (!leadFunil || !leadFunil.etapa_id) {
      return { valid: false, message: 'Lead não encontrado no funil' };
    }

    const etapaAtual = etapasMap.get(leadFunil.etapa_id);
    if (!etapaAtual) {
      return { valid: false, message: 'Etapa do lead não encontrada' };
    }

    // Define etapas mínimas: Qualificação ou superior
    const qualificacaoEtapa = Array.from(etapasMap.values()).find(
      e => e.nome.toLowerCase().includes('qualif')
    );
    const minOrdem = qualificacaoEtapa?.ordem || 2;

    if (etapaAtual.ordem < minOrdem) {
      return { 
        valid: false, 
        message: "Este lead precisa estar pelo menos em 'Qualificação' para enviar proposta." 
      };
    }

    return { valid: true };
  };

  // Filtra leads elegíveis para visitas (Qualificação ou superior)
  const filterLeadsForVisits = (leadsFunil: LeadFunil[]): LeadFunil[] => {
    const qualificacaoEtapa = Array.from(etapasMap.values()).find(
      e => e.nome.toLowerCase().includes('qualif')
    );
    const minOrdem = qualificacaoEtapa?.ordem || 2;

    return leadsFunil.filter(lf => {
      const ordem = getEtapaOrdem(lf.etapa_id);
      return ordem >= minOrdem;
    });
  };

  // Filtra leads elegíveis para propostas (Qualificação ou superior)
  const filterLeadsForProposals = (leadsFunil: LeadFunil[]): LeadFunil[] => {
    const qualificacaoEtapa = Array.from(etapasMap.values()).find(
      e => e.nome.toLowerCase().includes('qualif')
    );
    const minOrdem = qualificacaoEtapa?.ordem || 2;

    return leadsFunil.filter(lf => {
      const ordem = getEtapaOrdem(lf.etapa_id);
      return ordem >= minOrdem;
    });
  };

  return {
    etapas,
    etapasMap,
    getEtapaNome,
    getEtapaOrdem,
    canMoveToEtapa,
    canScheduleVisit,
    canCreateProposal,
    filterLeadsForVisits,
    filterLeadsForProposals,
  };
}
