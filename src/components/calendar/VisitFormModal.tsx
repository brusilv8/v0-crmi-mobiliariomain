import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLeads } from '@/hooks/useLeads';
import { useImoveis } from '@/hooks/useImoveis';
import { useCreateVisita } from '@/hooks/useVisitas';
import { useAuth } from '@/hooks/useAuth';
import { useUsuario } from '@/hooks/useUsuarios';
import { useLeadsFunil } from '@/hooks/useFunilEtapas';
import { useFunilValidation } from '@/hooks/useFunilValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';

const visitSchema = z.object({
  lead_id: z.string().min(1, 'Selecione um lead'),
  imovel_id: z.string().min(1, 'Selecione um imóvel'),
  data_hora: z.date({ required_error: 'Selecione data e hora' }),
  hora: z.string().min(1, 'Informe o horário'),
  duracao: z.coerce.number().min(15).max(480),
  tipo: z.enum(['presencial', 'virtual']),
  observacoes: z.string().optional(),
});

type VisitFormData = z.infer<typeof visitSchema>;

interface VisitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
}

export function VisitFormModal({ open, onOpenChange, initialDate }: VisitFormModalProps) {
  const { data: leads } = useLeads();
  const { data: imoveis } = useImoveis();
  const createVisita = useCreateVisita();
  const { user } = useAuth();
  const { data: usuario } = useUsuario(user?.id);
  const { data: leadsFunil } = useLeadsFunil();
  const { filterLeadsForVisits, canScheduleVisit, getEtapaNome } = useFunilValidation();

  // Filtrar apenas leads elegíveis (Qualificação ou superior)
  const eligibleLeadsFunil = useMemo(() => {
    if (!leadsFunil) return [];
    return filterLeadsForVisits(leadsFunil);
  }, [leadsFunil, filterLeadsForVisits]);

  const eligibleLeadIds = useMemo(() => {
    return new Set(eligibleLeadsFunil.map(lf => lf.lead_id));
  }, [eligibleLeadsFunil]);

  const eligibleLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter(lead => eligibleLeadIds.has(lead.id));
  }, [leads, eligibleLeadIds]);

  const form = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      data_hora: initialDate || new Date(),
      hora: '09:00',
      duracao: 60,
      tipo: 'presencial',
      observacoes: '',
    },
  });

  const onSubmit = async (data: VisitFormData) => {
    // Validar etapa do lead antes de criar visita
    const leadFunil = leadsFunil?.find(lf => lf.lead_id === data.lead_id);
    const validation = canScheduleVisit(leadFunil || null);
    
    if (!validation.valid) {
      toast.error(validation.message || 'Lead não elegível para visita');
      return;
    }

    const [hours, minutes] = data.hora.split(':');
    const dataHora = new Date(data.data_hora);
    dataHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    await createVisita.mutateAsync({
      lead_id: data.lead_id,
      imovel_id: data.imovel_id,
      corretor_id: usuario?.id,
      data_hora: dataHora.toISOString(),
      duracao: data.duracao,
      tipo: data.tipo,
      status: 'agendada',
      observacoes: data.observacoes,
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendar Visita</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {eligibleLeads.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum lead elegível para agendar visita. Leads devem estar pelo menos na etapa de "Qualificação" ou superior.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
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
                            {imovel.tipo} - {imovel.endereco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="data_hora"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data *</FormLabel>
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

              <FormField
                control={form.control}
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min) *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1h 30min</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Visita *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="presencial" id="presencial" />
                        <label htmlFor="presencial" className="cursor-pointer">
                          Presencial
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="virtual" id="virtual" />
                        <label htmlFor="virtual" className="cursor-pointer">
                          Virtual
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes adicionais sobre a visita..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createVisita.isPending}>
                {createVisita.isPending ? 'Agendando...' : 'Agendar Visita'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
