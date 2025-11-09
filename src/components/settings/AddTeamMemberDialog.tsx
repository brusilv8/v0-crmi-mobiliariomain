import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Shield, User, Users, Briefcase } from 'lucide-react';
import { useUsuarios, useActivateUsuario } from '@/hooks/useUsuarios';
import { Skeleton } from '@/components/ui/skeleton';

interface AddTeamMemberDialogProps {
  isCurrentUserAdmin: boolean;
}

export function AddTeamMemberDialog({ isCurrentUserAdmin }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'corretor' | 'assistente' | 'supervisor'>('assistente');
  
  const { data: usuarios = [], isLoading } = useUsuarios();
  const activateUsuario = useActivateUsuario();

  // Filtrar apenas usuários inativos
  const inactiveUsers = usuarios.filter((u) => !u.ativo);

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    await activateUsuario.mutateAsync({
      userId: selectedUserId,
      role: selectedRole,
    });

    setOpen(false);
    setSelectedUserId('');
    setSelectedRole('assistente');
  };

  const selectedUser = usuarios.find((u) => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!isCurrentUserAdmin}>
          <UserPlus className="w-4 h-4" />
          Adicionar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Membro à Equipe</DialogTitle>
          <DialogDescription>
            Selecione um usuário e defina sua função inicial
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : inactiveUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Não há usuários inativos disponíveis para adicionar
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuário</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {inactiveUsers.map((usuario) => {
                    const nomeUsuario =
                      typeof usuario.nome_completo === 'string' && usuario.nome_completo.trim() !== ''
                        ? usuario.nome_completo
                        : 'Usuário';
                    const iniciais = nomeUsuario.substring(0, 2).toUpperCase();

                    return (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={usuario.avatar_url || undefined} alt={nomeUsuario} />
                            <AvatarFallback className="text-xs">{iniciais}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{nomeUsuario}</span>
                            <span className="text-xs text-muted-foreground">{usuario.email}</span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback>
                      {(selectedUser.nome_completo || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.nome_completo || 'Usuário'}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Função</label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as any)}
              >
                <SelectTrigger>
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
                  {isCurrentUserAdmin && (
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={!selectedUserId || activateUsuario.isPending}
              >
                {activateUsuario.isPending ? 'Adicionando...' : 'Adicionar à Equipe'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
