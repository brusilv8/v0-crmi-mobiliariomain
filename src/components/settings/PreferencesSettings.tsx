import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Bell, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export function PreferencesSettings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  // Inicializar estados lendo diretamente do localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });
  
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('emailNotifications') === 'true';
  });
  
  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem('pushNotifications') === 'true';
  });

  // Aplicar tema ao montar componente
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    toast.success(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`);
  };

  const handleEmailNotificationsToggle = () => {
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    localStorage.setItem('emailNotifications', String(newValue));
    toast.success(`Notificações por email ${newValue ? 'ativadas' : 'desativadas'}`);
  };

  const handlePushNotificationsToggle = () => {
    const newValue = !pushNotifications;
    setPushNotifications(newValue);
    localStorage.setItem('pushNotifications', String(newValue));
    toast.success(`Notificações push ${newValue ? 'ativadas' : 'desativadas'}`);
  };

  const handleLogout = async () => {
    try {
      // 1. Obter sessão atual antes de deslogar
      const { data: { session } } = await supabase.auth.getSession();

      // 2. Deslogar no Supabase (com escopo global)
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error('Erro no signOut:', error);
        throw error;
      }

      // 3. Limpar todos os dados locais
      localStorage.clear();
      sessionStorage.clear();

      // 4. Mostrar mensagem de sucesso
      toast.success('Logout realizado com sucesso!');

      // 5. Redirecionar para login (forçando reload completo)
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao deslogar. Tente novamente.');

      // Fallback: forçar logout mesmo com erro
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Personalize a aparência da aplicação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="theme-toggle" className="text-base font-medium cursor-pointer">
                  Tema {theme === 'dark' ? 'Escuro' : 'Claro'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {theme === 'dark' ? 'Interface escura para ambientes com pouca luz' : 'Interface clara e vibrante'}
                </p>
              </div>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Gerencie como você recebe notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-notifications" className="text-base font-medium cursor-pointer">
                  Notificações por Email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receba atualizações importantes por email
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={handleEmailNotificationsToggle}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push-notifications" className="text-base font-medium cursor-pointer">
                  Notificações Push
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações push no navegador
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={handlePushNotificationsToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis da conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sair da Conta</p>
              <p className="text-sm text-muted-foreground">
                Desconectar e retornar à página de login
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
