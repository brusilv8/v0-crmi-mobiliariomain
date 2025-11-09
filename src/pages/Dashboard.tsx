import { 
  Users, 
  TrendingUp, 
  Home,
  Calendar,
  FileText,
  Target
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { AtividadesRecentes } from "@/components/dashboard/AtividadesRecentes";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useImoveis } from "@/hooks/useImoveis";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: imoveis } = useImoveis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do desempenho de vendas
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Leads Ativos"
          value={metricsLoading ? "-" : metrics?.totalLeads || 0}
          icon={Users}
          iconColor="bg-primary"
        />
        <StatCard
          title="Taxa de Conversão"
          value={metricsLoading ? "-" : `${metrics?.taxaConversao || 0}%`}
          icon={TrendingUp}
          iconColor="bg-secondary"
        />
        <StatCard
          title="Imóveis Cadastrados"
          value={imoveis?.length || 0}
          icon={Home}
          iconColor="bg-status-qualified"
        />
        <StatCard
          title="Visitas Hoje"
          value={metricsLoading ? "-" : metrics?.visitasHoje || 0}
          icon={Calendar}
          iconColor="bg-warning"
        />
        <StatCard
          title="Propostas em Análise"
          value={metricsLoading ? "-" : metrics?.propostasAnalise || 0}
          icon={FileText}
          iconColor="bg-status-proposal"
        />
        <StatCard
          title="Leads por Origem"
          value={metrics?.leadsPorOrigem?.length || 0}
          icon={Target}
          iconColor="bg-primary-dark"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FunnelChart />
        </div>
        <div>
          <AtividadesRecentes />
        </div>
      </div>
    </div>
  );
}
