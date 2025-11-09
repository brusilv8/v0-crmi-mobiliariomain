import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, User, Users, Briefcase, Lock } from 'lucide-react';
import { useUsuarios, useUpdateUsuarioRole, useUsuario } from '@/hooks/useUsuarios';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Usuario } from '@/types/database.types';
import { useAuth } from '@/hooks/useAuth';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';

const roleConfig = {
  admin: { label: 'Admin', icon: Shield, variant: 'default' as const, color: 'text-primary' },
  supervisor: { label: 'Supervisor', icon: Briefcase, variant: 'secondary' as const, color: 'text-blue-600' },
  corretor: { label: 'Corretor', icon: User, variant: 'secondary' as const, color: 'text-green-600' },
  assistente: { label: 'Assistente', icon: Users, variant: 'outline' as const, color: 'text-muted-foreground' },
};

export function TeamManagement() {
  const { user } = useAuth();
  const { data: currentUser } = useUsuario(user?.id);
  const { data: usuarios = [], isLoading } = useUsuarios();
  const updateRole = useUpdateUsuarioRole();

  const isCurrentUserAdmin = currentUser?.role === 'admin';

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'corretor' | 'assistente' | 'supervisor') => {
    // Validação: apenas admin pode atribuir role admin
    if (newRole === 'admin' && !isCurrentUserAdmin) {
      return;
    }
    await updateRole.mutateAsync({ userId, role: newRole });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>Gerencie os membros e permissões da sua equipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrar apenas usuários ativos para mostrar na tabela
  const activeUsers = usuarios.filter((u) => u.ativo);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Membros da Equipe</CardTitle>
              <CardDescription>
                Gerencie as funções dos membros da equipe ({activeUsers.length} membros ativos)
              </CardDescription>
            </div>
            <AddTeamMemberDialog isCurrentUserAdmin={isCurrentUserAdmin} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeUsers && activeUsers.length > 0 ? (
                  activeUsers.map((usuario) => {
                    // Validação segura de role
                    const userRole = usuario.role && typeof usuario.role === 'string' 
                      ? usuario.role.toLowerCase() 
                      : 'assistente';
                    
                    // Garantir que o role seja válido
                    const validRoles: Array<keyof typeof roleConfig> = ['admin', 'supervisor', 'corretor', 'assistente'];
                    const role = validRoles.includes(userRole as any) 
                      ? (userRole as keyof typeof roleConfig)
                      : 'assistente';
                    
                    const roleInfo = roleConfig[role];
                    
                    // Validações de segurança para todos os campos
                    const nomeUsuario = typeof usuario.nome_completo === 'string' && usuario.nome_completo.trim() !== '' 
                      ? usuario.nome_completo 
                      : 'Usuário';
                    const emailUsuario = typeof usuario.email === 'string' ? usuario.email : '-';
                    const telefoneUsuario = typeof usuario.telefone === 'string' && usuario.telefone.trim() !== '' 
                      ? usuario.telefone 
                      : null;
                    const cargoUsuario = typeof usuario.cargo === 'string' && usuario.cargo.trim() !== '' 
                      ? usuario.cargo 
                      : '-';
                    const iniciais = nomeUsuario.substring(0, 2).toUpperCase();

                    return (
                      <TableRow key={usuario.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={usuario.avatar_url || undefined} alt={nomeUsuario} />
                              <AvatarFallback>
                                {iniciais}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{nomeUsuario}</p>
                              {telefoneUsuario && (
                                <p className="text-sm text-muted-foreground">{telefoneUsuario}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{emailUsuario}</TableCell>
                        <TableCell>{cargoUsuario}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Select
                              value={role}
                              onValueChange={(newRole) => handleRoleChange(usuario.id, newRole as any)}
                              disabled={updateRole.isPending}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="assistente">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Assistente
                                  </div>
                                </SelectItem>
                                <SelectItem value="corretor">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Corretor
                                  </div>
                                </SelectItem>
                                <SelectItem value="supervisor">
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Supervisor
                                  </div>
                                </SelectItem>
                                {isCurrentUserAdmin ? (
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <Shield className="w-4 h-4" />
                                      Admin
                                    </div>
                                  </SelectItem>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm opacity-50 outline-none">
                                        <Lock className="mr-2 w-4 h-4" />
                                        Admin (Bloqueado)
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Apenas administradores podem atribuir a função Admin</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </SelectContent>
                            </Select>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum membro na equipe
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
