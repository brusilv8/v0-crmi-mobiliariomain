import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, Settings as SettingsIcon } from 'lucide-react';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { TeamManagement } from '@/components/settings/TeamManagement';
import { PreferencesSettings } from '@/components/settings/PreferencesSettings';
import { FunnelRulesSettings } from '@/components/settings/FunnelRulesSettings';
import { useSearchParams } from 'react-router-dom';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e equipe</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Equipe
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="funnel-rules" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Regras do Funil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <PreferencesSettings />
        </TabsContent>

        <TabsContent value="funnel-rules" className="space-y-4">
          <FunnelRulesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
