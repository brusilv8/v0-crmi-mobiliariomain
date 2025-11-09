import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useImoveis } from '@/hooks/useImoveis';
import { useCreateProposta, useUpdateProposta } from '@/hooks/usePropostas';
import { useLeadsFunil } from '@/hooks/useFunilEtapas';
import { useFunilValidation } from '@/hooks/useFunilValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { Proposta } from '@/types/database.types';

const proposalSchema = z.object({
  lead_id: z.string().min(1, 'Selecione um lead'),
  imovel_id: z.string().min(1, 'Selecione um imóvel'),
  valor: z.coerce.number().min(1, 'Informe o valor'),
  validade: z.date({ required_error: 'Selecione a validade' }),
  valor_entrada: z.coerce.number().optional(),
  num_parcelas: z.coerce.number().optional(),
  usa_fgts: z.boolean().default(false),
  condicoes_especiais: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface ProposalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposta?: Proposta | null;
}

export function ProposalFormModal({ open, onOpenChange, proposta }: ProposalFormModalProps) {
  const [step, setStep] = useState(1);
  const { data: leads } = useLeads();
  const { data: imoveis } = useImoveis();
  const createProposta = useCreateProposta();
  const updateProposta = useUpdateProposta();
  const { data: leadsFunil } = useLeadsFunil();
  const { filterLeadsForProposals, canCreateProposal, getEtapaNome } = useFunilValidation();

  const isEditMode = !!proposta;

  // Filtrar apenas leads elegíveis (Qualificação ou superior)
  const eligibleLeadsFunil = useMemo(() => {
    if (!leadsFunil) return [];
    return filterLeadsForProposals(leadsFunil);
  }, [leadsFunil, filterLeadsForProposals]);

  const eligibleLeadIds = useMemo(() => {
    return new Set(eligibleLeadsFunil.map(lf => lf.lead_id));
  }, [eligibleLeadsFunil]);

  const eligibleLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter(lead => eligibleLeadIds.has(lead.id));
  }, [leads, eligibleLeadIds]);

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: proposta ? {
      lead_id: proposta.lead_id,
      imovel_id: proposta.imovel_id,
      valor: proposta.valor,
      validade: new Date(proposta.validade),
      valor_entrada: proposta.valor_entrada || undefined,
      num_parcelas: proposta.num_parcelas || 360,
      usa_fgts: proposta.usa_fgts || false,
      condicoes_especiais: proposta.condicoes_especiais || undefined,
    } : {
      validade: addDays(new Date(), 15),
      usa_fgts: false,
      num_parcelas: 360,
    },
  });

  const valorProposta = form.watch('valor') || 0;
  const valorEntrada = form.watch('valor_entrada') || 0;
  const numParcelas = form.watch('num_parcelas') || 360;
  const usaFgts = form.watch('usa_fgts');

  // Cálculo Sistema Price (simplificado - taxa 0.8% a.m.)
  const taxaMensal = 0.008;
  const valorFinanciado = valorProposta - valorEntrada;
  const valorParcela =
    valorFinanciado > 0
      ? (valorFinanciado * taxaMensal * Math.pow(1 + taxaMensal, numParcelas)) /
        (Math.pow(1 + taxaMensal, numParcelas) - 1)
      : 0;

  const onSubmit = async (data: ProposalFormData) => {
    // Só permite criar/editar proposta se estiver na etapa final
    if (step !== 3) {
      nextStep();
      return;
    }

    if (isEditMode && proposta) {
      // Modo edição
      await updateProposta.mutateAsync({
        id: proposta.id,
        lead_id: data.lead_id,
        imovel_id: data.imovel_id,
        valor: data.valor,
        valor_entrada: data.valor_entrada,
        num_parcelas: data.num_parcelas,
        usa_fgts: data.usa_fgts,
        condicoes_especiais: data.condicoes_especiais,
        validade: data.validade.toISOString(),
      });
    } else {
      // Validar etapa do lead antes de criar proposta
      const leadFunil = leadsFunil?.find(lf => lf.lead_id === data.lead_id);
      const validation = canCreateProposal(leadFunil || null);
      
      if (!validation.valid) {
        toast.error(validation.message || 'Lead não elegível para proposta');
        return;
      }

      await createProposta.mutateAsync({
        lead_id: data.lead_id,
        imovel_id: data.imovel_id,
        valor: data.valor,
        valor_entrada: data.valor_entrada,
        num_parcelas: data.num_parcelas,
        usa_fgts: data.usa_fgts,
        condicoes_especiais: data.condicoes_especiais,
        status: 'pendente',
        validade: data.validade.toISOString(),
      });
    }

    form.reset();
    setStep(1);
    onOpenChange(false);
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar' : 'Nova'} Proposta Comercial</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  s <= step ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                {eligibleLeads.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum lead elegível para criar proposta. Leads devem estar pelo menos na etapa de "Qualificação" ou superior.
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="lead_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={eligibleLeads.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eligibleLeads?.map((lead) => {
                            const leadFunil = eligibleLeadsFunil.find(lf => lf.lead_id === lead.id);
                            const etapaNome = leadFunil ? getEtapaNome(leadFunil.etapa_id) : '';
                            return (
                              <SelectItem key={lead.id} value={lead.id}>
                                {lead.nome} - {lead.telefone} {etapaNome && `(${etapaNome})`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imovel_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imóvel *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o imóvel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {imoveis?.map((imovel) => (
                            <SelectItem key={imovel.id} value={imovel.id}>
                              {imovel.tipo} - {imovel.endereco} -{' '}
                              {(imovel.valor_venda || imovel.valor_aluguel || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Proposta *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validade"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Validade *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor_entrada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor de Entrada</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="num_parcelas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Parcelas</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="12">12 meses</SelectItem>
                            <SelectItem value="24">24 meses</SelectItem>
                            <SelectItem value="36">36 meses</SelectItem>
                            <SelectItem value="60">60 meses</SelectItem>
                            <SelectItem value="120">120 meses</SelectItem>
                            <SelectItem value="180">180 meses</SelectItem>
                            <SelectItem value="240">240 meses</SelectItem>
                            <SelectItem value="360">360 meses</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="usa_fgts"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Utilizar FGTS</FormLabel>
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">Simulação de Financiamento</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor a Financiar</p>
                      <p className="font-semibold">
                        {valorFinanciado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor da Parcela</p>
                      <p className="font-semibold text-primary">
                        {valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa de Juros</p>
                      <p className="font-semibold">0,8% a.m.</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total a Pagar</p>
                      <p className="font-semibold">
                        {(valorParcela * numParcelas + valorEntrada).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="condicoes_especiais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condições Especiais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva condições especiais, descontos, bônus..."
                          {...field}
                          rows={6}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Resumo da Proposta</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Total:</span>
                      <span className="font-semibold">
                        {valorProposta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    {valorEntrada > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrada:</span>
                        <span className="font-semibold">
                          {valorEntrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    )}
                    {numParcelas > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parcelas:</span>
                        <span className="font-semibold">
                          {numParcelas}x de{' '}
                          {valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    )}
                    {usaFgts && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">FGTS:</span>
                        <span className="font-semibold text-green-600">Sim</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>

              {step < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={createProposta.isPending}>
                  {createProposta.isPending ? 'Criando...' : 'Criar Proposta'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
