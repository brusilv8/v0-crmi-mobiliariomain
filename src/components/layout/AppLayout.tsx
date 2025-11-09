import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card flex items-center px-6 sticky top-0 z-50 shrink-0">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1 flex items-center justify-between min-w-0">
              <h2 className="text-lg font-semibold">CRM Imobiliário</h2>
              <div className="flex items-center gap-4">
                {/* Espaço para notificações e perfil */}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
