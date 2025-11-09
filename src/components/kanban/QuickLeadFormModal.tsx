import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLead } from '@/hooks/useLeads';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flame, Sun, Snowflake } from 'lucide-react';

const leadSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  telefone: z.string().trim().min(10, 'Telefone inválido').max(20),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  origem: z.string().trim().min(1, 'Selecione a origem').max(50),
  temperatura: z.enum(['cold', 'warm', 'hot'], { required_error: 'Selecione a temperatura' }),
  orcamento_min: z.coerce.number().optional(),
  orcamento_max: z.coerce.number().optional(),
  interesse: z.string().max(200).optional(),
  observacoes: z.string().max(500).optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface QuickLeadFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickLeadFormModal({ open, onOpenChange }: QuickLeadFormModalProps) {
  const { mutate: createLead, isPending } = useCreateLead();
  
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      origem: '',
      temperatura: 'warm',
    },
  });

  const onSubmit = (data: LeadFormData) => {
    createLead(data as any, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Atendimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="João Silva"
                {...form.register('nome')}
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(11) 98765-4321"
                {...form.register('telefone')}
              />
              {form.formState.errors.telefone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.telefone.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@email.com"
                {...form.register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Origem *</Label>
              <Select 
                value={form.watch('origem')} 
                onValueChange={(value) => form.setValue('origem', value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="portal">Portal Imobiliário</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="redes_sociais">Redes Sociais</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="imovel">Imóvel</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.origem && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.origem.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Temperatura *</Label>
            <div className="flex gap-4">
              {[
                { value: 'cold', label: 'Frio', icon: Snowflake, color: 'text-temperature-cold' },
                { value: 'warm', label: 'Morno', icon: Sun, color: 'text-temperature-warm' },
                { value: 'hot', label: 'Quente', icon: Flame, color: 'text-temperature-hot' },
              ].map((temp) => {
                const Icon = temp.icon;
                return (
                  <label
                    key={temp.value}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      form.watch('temperatura') === temp.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      value={temp.value}
                      {...form.register('temperatura')}
                      className="sr-only"
                    />
                    <Icon className={`w-4 h-4 ${temp.color}`} />
                    <span className="font-medium">{temp.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orcamento_min">Orçamento mínimo</Label>
              <Input
                id="orcamento_min"
                type="number"
                placeholder="250000"
                {...form.register('orcamento_min')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orcamento_max">Orçamento máximo</Label>
              <Input
                id="orcamento_max"
                type="number"
                placeholder="500000"
                {...form.register('orcamento_max')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interesse">Interesse</Label>
            <Input
              id="interesse"
              placeholder="Apartamento 3 quartos, zona sul"
              {...form.register('interesse')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais..."
              rows={4}
              {...form.register('observacoes')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Criar Atendimento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
