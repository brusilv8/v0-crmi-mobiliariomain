import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Camera, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateUsuario, useUsuario } from '@/hooks/useUsuarios';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const profileSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfileSettings() {
  const { user } = useAuth();
  const { data: usuario, isLoading } = useUsuario(user?.id);
  const updateUsuario = useUpdateUsuario();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      nome_completo: usuario?.nome_completo || '',
      telefone: usuario?.telefone || '',
      cargo: usuario?.cargo || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!usuario?.id) return;
    
    await updateUsuario.mutateAsync({
      id: usuario.id,
      ...data,
    });
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      // Verificar senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword,
      });

      if (signInError) {
        toast.error('Senha atual incorreta');
        return;
      }

      // Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
      return;
    }

    try {
      setUploading(true);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar perfil do usuário
      if (usuario?.id) {
        await updateUsuario.mutateAsync({
          id: usuario.id,
          avatar_url: publicUrl,
        });
      }

      setAvatarUrl(publicUrl);
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize suas informações de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize suas informações de perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl || usuario?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {usuario?.nome_completo?.substring(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={handleAvatarClick}
                disabled={uploading}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="font-semibold">{usuario?.nome_completo}</p>
              <p className="text-sm text-muted-foreground">{usuario?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique no ícone para alterar a foto
              </p>
            </div>
          </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cargo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Corretor Senior" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUsuario.isPending}>
                {updateUsuario.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <div>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Atualize sua senha de acesso</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Atual</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Digite sua senha atual" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Digite a nova senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirme a nova senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => passwordForm.reset()}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Alterar Senha
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    </div>
  );
}
