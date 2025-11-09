import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCreateImovel, useUpdateImovel } from "@/hooks/useImoveis";
import type { Imovel } from "@/types/database.types";
import InputMask from "react-input-mask";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { useEffect } from "react";

const propertySchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório"),
  finalidade: z.enum(["venda", "aluguel"]),
  cep: z.string().min(8, "CEP inválido"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  valor_venda: z.number().optional(),
  valor_aluguel: z.number().optional(),
  valor_condominio: z.number().optional(),
  valor_iptu: z.number().optional(),
  quartos: z.number().optional(),
  banheiros: z.number().optional(),
  vagas: z.number().optional(),
  area_total: z.number().optional(),
  area_util: z.number().optional(),
  descricao: z.string().optional(),
  status: z.enum(["disponivel", "reservado", "vendido", "alugado"]),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Imovel | null;
}

export function PropertyFormModal({ open, onOpenChange, property }: PropertyFormModalProps) {
  const [step, setStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createImovel = useCreateImovel();
  const updateImovel = useUpdateImovel();
  
  const isEditing = !!property;
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      finalidade: "venda",
      status: "disponivel",
    },
  });

  const finalidade = watch("finalidade");
  const cep = watch("cep");

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (property && open) {
      setValue("tipo", property.tipo);
      setValue("finalidade", property.finalidade);
      setValue("cep", property.cep);
      setValue("endereco", property.endereco);
      setValue("cidade", property.cidade);
      setValue("estado", property.estado);
      setValue("bairro", property.bairro);
      setValue("numero", property.numero || "");
      setValue("complemento", property.complemento || "");
      setValue("valor_venda", property.valor_venda || undefined);
      setValue("valor_aluguel", property.valor_aluguel || undefined);
      setValue("valor_condominio", property.valor_condominio || undefined);
      setValue("valor_iptu", property.valor_iptu || undefined);
      setValue("quartos", property.quartos || undefined);
      setValue("banheiros", property.banheiros || undefined);
      setValue("vagas", property.vagas || undefined);
      setValue("area_total", property.area_total || undefined);
      setValue("area_util", property.area_util || undefined);
      setValue("descricao", property.descricao || "");
      setValue("status", property.status);
      setUploadedImage(property.imagem_principal || null);
    }
  }, [property, open, setValue]);

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setValue("endereco", data.logradouro);
          setValue("bairro", data.bairro);
          setValue("cidade", data.localidade);
          setValue("estado", data.uf);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `imoveis/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('imoveis')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('imoveis')
        .getPublicUrl(filePath);

      setUploadedImage(publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar imagem: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: PropertyFormData) => {
    console.log('🟢 INÍCIO onSubmit');
    console.log('📦 Dados:', data);
    
    // Ensure required fields are present
    if (!data.tipo || !data.finalidade || !data.cep || !data.endereco || 
        !data.cidade || !data.estado || !data.bairro || !data.status) {
      console.log('⚠️ Campos obrigatórios faltando');
      return;
    }
    
    try {
      console.log('🚀 Chamando mutation...');
      await createImovel.mutateAsync(data as any);
      console.log('✅ Sucesso!');
      reset();
      setStep(1);
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ ERRO:', error);
    }
  };

  const handleFinalSubmit = async () => {
    // Pegar todos os valores atuais do formulário
    const formValues = watch();
    
    // Validação básica
    if (!formValues.tipo || !formValues.finalidade || !formValues.endereco || 
        !formValues.cidade || !formValues.estado || !formValues.bairro || !formValues.cep) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    // Montar payload
    const payload = {
      tipo: formValues.tipo,
      finalidade: formValues.finalidade,
      descricao: formValues.descricao || null,
      endereco: formValues.endereco,
      numero: formValues.numero || null,
      complemento: formValues.complemento || null,
      bairro: formValues.bairro,
      cidade: formValues.cidade,
      estado: formValues.estado,
      cep: formValues.cep,
      valor_venda: formValues.valor_venda || null,
      valor_aluguel: formValues.valor_aluguel || null,
      valor_condominio: formValues.valor_condominio || null,
      valor_iptu: formValues.valor_iptu || null,
      quartos: formValues.quartos || null,
      banheiros: formValues.banheiros || null,
      vagas: formValues.vagas || null,
      area_total: formValues.area_total || null,
      area_util: formValues.area_util || null,
      status: formValues.status || 'disponivel',
      imagem_principal: uploadedImage || null,
    };
    
    try {
      if (isEditing && property) {
        await updateImovel.mutateAsync({ id: property.id, ...payload } as any);
        toast.success('Imóvel atualizado com sucesso!');
      } else {
        await createImovel.mutateAsync(payload as any);
        toast.success('Imóvel cadastrado com sucesso!');
      }
      reset();
      setStep(1);
      setUploadedImage(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'}: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    setUploadedImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-12 bg-primary' : s < step ? 'w-8 bg-primary/50' : 'w-8 bg-muted'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Dados Básicos */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label>Imagem Principal</Label>
                <div className="flex flex-col gap-3">
                  {uploadedImage ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={uploadedImage}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isUploading ? 'Enviando...' : 'Clique para adicionar uma imagem'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG ou WEBP (máx. 5MB)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select onValueChange={(value) => setValue("tipo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apartamento">Apartamento</SelectItem>
                      <SelectItem value="Casa">Casa</SelectItem>
                      <SelectItem value="Cobertura">Cobertura</SelectItem>
                      <SelectItem value="Terreno">Terreno</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Galpão">Galpão</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipo && <p className="text-sm text-destructive">{errors.tipo.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Finalidade *</Label>
                  <RadioGroup
                    value={finalidade}
                    onValueChange={(value: "venda" | "aluguel") => setValue("finalidade", value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="venda" id="venda" />
                      <Label htmlFor="venda">Venda</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="aluguel" id="aluguel" />
                      <Label htmlFor="aluguel">Aluguel</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CEP *</Label>
                  <InputMask
                    mask="99999-999"
                    value={cep}
                    onChange={(e) => {
                      setValue("cep", e.target.value);
                      fetchAddressByCEP(e.target.value);
                    }}
                  >
                    {(inputProps: any) => <Input {...inputProps} placeholder="00000-000" />}
                  </InputMask>
                  {errors.cep && <p className="text-sm text-destructive">{errors.cep.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Estado *</Label>
                  <Input {...register("estado")} placeholder="UF" maxLength={2} />
                  {errors.estado && <p className="text-sm text-destructive">{errors.estado.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereço *</Label>
                <Input {...register("endereco")} placeholder="Rua, Avenida..." />
                {errors.endereco && <p className="text-sm text-destructive">{errors.endereco.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input {...register("numero")} placeholder="123" />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Complemento</Label>
                  <Input {...register("complemento")} placeholder="Apto 101, Bloco A..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bairro *</Label>
                  <Input {...register("bairro")} placeholder="Bairro" />
                  {errors.bairro && <p className="text-sm text-destructive">{errors.bairro.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Cidade *</Label>
                  <Input {...register("cidade")} placeholder="Cidade" />
                  {errors.cidade && <p className="text-sm text-destructive">{errors.cidade.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{finalidade === "venda" ? "Valor de Venda" : "Valor do Aluguel"}</Label>
                  <Input
                    type="number"
                    {...register(finalidade === "venda" ? "valor_venda" : "valor_aluguel", {
                      valueAsNumber: true,
                    })}
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Condomínio</Label>
                  <Input
                    type="number"
                    {...register("valor_condominio", { valueAsNumber: true })}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Características */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Quartos</Label>
                  <Input
                    type="number"
                    {...register("quartos", { valueAsNumber: true })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Banheiros</Label>
                  <Input
                    type="number"
                    {...register("banheiros", { valueAsNumber: true })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vagas</Label>
                  <Input
                    type="number"
                    {...register("vagas", { valueAsNumber: true })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>IPTU</Label>
                  <Input
                    type="number"
                    {...register("valor_iptu", { valueAsNumber: true })}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área Total (m²)</Label>
                  <Input
                    type="number"
                    {...register("area_total", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Área Útil (m²)</Label>
                  <Input
                    type="number"
                    {...register("area_util", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  {...register("descricao")}
                  placeholder="Descreva as características do imóvel..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmação */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-6 space-y-3">
                <h4 className="font-semibold text-lg">Confirme os dados</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{watch("tipo")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Finalidade:</span>
                    <p className="font-medium">{watch("finalidade") === "venda" ? "Venda" : "Aluguel"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Endereço:</span>
                    <p className="font-medium">
                      {watch("endereco")}, {watch("numero")} - {watch("bairro")}
                    </p>
                    <p className="font-medium">
                      {watch("cidade")} - {watch("estado")}, {watch("cep")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <p className="font-medium">
                      R$ {(watch(finalidade === "venda" ? "valor_venda" : "valor_aluguel") || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Características:</span>
                    <p className="font-medium">
                      {watch("quartos") || 0} quartos, {watch("banheiros") || 0} banheiros, {watch("vagas") || 0} vagas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={() => setStep(step + 1)}>
                Próximo
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleFinalSubmit}
                disabled={createImovel.isPending}
              >
                {createImovel.isPending ? "Cadastrando..." : "Cadastrar Imóvel"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
