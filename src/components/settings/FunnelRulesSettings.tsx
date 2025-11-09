import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFunilEtapas } from '@/hooks/useFunilEtapas';
import { useFunilRegras, useBulkUpdateRegras } from '@/hooks/useFunilRegras';
import { AlertCircle, ArrowRight, Save, Info } from 'lucide-react';
import type { FunilRegraTransicao } from '@/types/database.types';

export function FunnelRulesSettings() {
  const { data: etapas, isLoading: etapasLoading } = useFunilEtapas();
  const { data: regrasExistentes, isLoading: regrasLoading } = useFunilRegras();
  const bulkUpdate = useBulkUpdateRegras();
  
  const [regras, setRegras] = useState<Map<string, boolean>>(new Map());
  const [observacoes, setObservacoes] = useState<Map<string, string>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  // Criar chave única para cada transição
  const getTransitionKey = (origemId: string, destinoId: string) => {
    return `${origemId}|${destinoId}`;
  };

  // Inicializar regras existentes quando carregarem
  useEffect(() => {
    if (!regrasExistentes) return;
    
    const newRegras = new Map<string, boolean>();
    const newObs = new Map<string, string>();
    
    regrasExistentes.forEach(regra => {
      const key = getTransitionKey(regra.etapa_origem_id, regra.etapa_destino_id);
      newRegras.set(key, regra.pode_transitar);
      if (regra.observacao) {
        newObs.set(key, regra.observacao);
      }
    });
    
    setRegras(newRegras);
    setObservacoes(newObs);
    setHasChanges(false);
  }, [regrasExistentes]);

  // Gerar todas as transições possíveis
  const transicoes = useMemo(() => {
    if (!etapas) return [];
    
    const transitions = [];
    for (let i = 0; i < etapas.length; i++) {
      for (let j = 0; j < etapas.length; j++) {
        if (i !== j) {
          const origem = etapas[i];
          const destino = etapas[j];
          const key = getTransitionKey(origem.id, destino.id);
          
          // Determinar se é avanço, retrocesso ou pulo
          const diferencaOrdem = destino.ordem - origem.ordem;
          let tipo: 'avanco' | 'retrocesso' | 'pulo';
          
          if (diferencaOrdem === 1) {
            tipo = 'avanco';
          } else if (diferencaOrdem < 0) {
            tipo = 'retrocesso';
          } else {
            tipo = 'pulo';
          }
          
          // Regras padrão: permitir avanço sequencial e retrocesso, bloquear pulos
          const permitidoPadrao = tipo !== 'pulo';
          const permitido = regras.has(key) ? regras.get(key)! : permitidoPadrao;
          
          transitions.push({
            key,
            origem,
            destino,
            tipo,
            permitido,
            observacao: observacoes.get(key) || '',
          });
        }
      }
    }
    
    return transitions;
  }, [etapas, regras, observacoes]);

  const handleToggle = (key: string, value: boolean) => {
    const newRegras = new Map(regras);
    newRegras.set(key, value);
    setRegras(newRegras);
    setHasChanges(true);
  };

  const handleObservacao = (key: string, value: string) => {
    const newObs = new Map(observacoes);
    if (value) {
      newObs.set(key, value);
    } else {
      newObs.delete(key);
    }
    setObservacoes(newObs);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!etapas) return;
    
    const regrasParaSalvar: Array<Omit<FunilRegraTransicao, 'id' | 'created_at' | 'updated_at' | 'etapa_origem' | 'etapa_destino'>> = [];
    
    transicoes.forEach(transicao => {
      const permitido = regras.get(transicao.key);
      const obs = observacoes.get(transicao.key);
      
      // Apenas salvar regras que foram explicitamente definidas
      if (permitido !== undefined) {
        regrasParaSalvar.push({
          etapa_origem_id: transicao.origem.id,
          etapa_destino_id: transicao.destino.id,
          pode_transitar: permitido,
          observacao: obs || undefined,
        });
      }
    });
    
    await bulkUpdate.mutateAsync(regrasParaSalvar);
    setHasChanges(false);
  };

  const handleResetToDefault = () => {
    setRegras(new Map());
    setObservacoes(new Map());
    setHasChanges(true);
  };

  if (etapasLoading || regrasLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando configurações...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const transicoesAgrupadas = {
    avanco: transicoes.filter(t => t.tipo === 'avanco'),
    retrocesso: transicoes.filter(t => t.tipo === 'retrocesso'),
    pulo: transicoes.filter(t => t.tipo === 'pulo'),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regras de Progressão no Funil</CardTitle>
          <CardDescription>
            Configure quais transições entre etapas do funil são permitidas ou bloqueadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Por padrão, leads podem avançar sequencialmente e retroceder livremente, mas não podem pular etapas.
              Use esta configuração para personalizar o comportamento.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || bulkUpdate.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {bulkUpdate.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleResetToDefault}
              disabled={!hasChanges}
            >
              Restaurar Padrão
            </Button>
          </div>

          {/* Avanços Sequenciais */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Avanços Sequenciais</h3>
              <Badge variant="secondary">{transicoesAgrupadas.avanco.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Transições para a próxima etapa imediata
            </p>
            
            <div className="space-y-3">
              {transicoesAgrupadas.avanco.map(transicao => (
                <Card key={transicao.key}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge style={{ backgroundColor: transicao.origem.cor }}>
                          {transicao.origem.nome}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge style={{ backgroundColor: transicao.destino.cor }}>
                          {transicao.destino.nome}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Label htmlFor={transicao.key} className="text-sm cursor-pointer">
                          {transicao.permitido ? 'Permitido' : 'Bloqueado'}
                        </Label>
                        <Switch
                          id={transicao.key}
                          checked={transicao.permitido}
                          onCheckedChange={(checked) => handleToggle(transicao.key, checked)}
                        />
                      </div>
                    </div>
                    
                    {!transicao.permitido && (
                      <Textarea
                        placeholder="Motivo do bloqueio (opcional)"
                        value={transicao.observacao}
                        onChange={(e) => handleObservacao(transicao.key, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pulos de Etapa */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Pulos de Etapa</h3>
              <Badge variant="secondary">{transicoesAgrupadas.pulo.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Transições que pulam uma ou mais etapas intermediárias
            </p>
            
            <div className="space-y-3">
              {transicoesAgrupadas.pulo.map(transicao => (
                <Card key={transicao.key}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge style={{ backgroundColor: transicao.origem.cor }}>
                          {transicao.origem.nome}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge style={{ backgroundColor: transicao.destino.cor }}>
                          {transicao.destino.nome}
                        </Badge>
                        <Badge variant="destructive" className="text-xs">
                          Pulo
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Label htmlFor={transicao.key} className="text-sm cursor-pointer">
                          {transicao.permitido ? 'Permitido' : 'Bloqueado'}
                        </Label>
                        <Switch
                          id={transicao.key}
                          checked={transicao.permitido}
                          onCheckedChange={(checked) => handleToggle(transicao.key, checked)}
                        />
                      </div>
                    </div>
                    
                    {transicao.permitido && (
                      <Textarea
                        placeholder="Justificativa para permitir pulo (opcional)"
                        value={transicao.observacao}
                        onChange={(e) => handleObservacao(transicao.key, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Retrocessos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Retrocessos</h3>
              <Badge variant="secondary">{transicoesAgrupadas.retrocesso.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Transições para etapas anteriores (geralmente permitidas)
            </p>
            
            <div className="space-y-3">
              {transicoesAgrupadas.retrocesso.map(transicao => (
                <Card key={transicao.key}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge style={{ backgroundColor: transicao.origem.cor }}>
                          {transicao.origem.nome}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge style={{ backgroundColor: transicao.destino.cor }}>
                          {transicao.destino.nome}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Label htmlFor={transicao.key} className="text-sm cursor-pointer">
                          {transicao.permitido ? 'Permitido' : 'Bloqueado'}
                        </Label>
                        <Switch
                          id={transicao.key}
                          checked={transicao.permitido}
                          onCheckedChange={(checked) => handleToggle(transicao.key, checked)}
                        />
                      </div>
                    </div>
                    
                    {!transicao.permitido && (
                      <Textarea
                        placeholder="Motivo do bloqueio (opcional)"
                        value={transicao.observacao}
                        onChange={(e) => handleObservacao(transicao.key, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
