# Setup de Finalização de Leads e Histórico de Propostas

## Instruções de Setup

### 1. Executar Migration no Supabase

Acesse o **Supabase SQL Editor** e execute o script `add_lead_finalizacao.sql`:

\`\`\`sql
-- Add finalizado and data_finalizacao columns to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS finalizado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_finalizacao TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_finalizado ON public.leads(finalizado);

-- Add comment
COMMENT ON COLUMN public.leads.finalizado IS 'Indica se o lead foi convertido em cliente e finalizado';
COMMENT ON COLUMN public.leads.data_finalizacao IS 'Data em que o lead foi marcado como finalizado';
\`\`\`

### 2. Funcionalidades Implementadas

#### ✅ Sistema de Finalização de Leads
- **Botão "Finalizar e Converter em Cliente"** no modal de detalhes do lead
- Ao finalizar um lead:
  - Lead é marcado como finalizado
  - Removido automaticamente do funil de vendas
  - Movido para a área de "Clientes"
  - Histórico completo é mantido

#### ✅ Página "Clientes" (`/customers`)
- Lista todos os leads finalizados
- Busca por nome, email ou telefone
- Botão "Reativar" para voltar o cliente ao funil
- Data de finalização visível
- Acesso completo ao histórico do cliente

#### ✅ Página "Histórico de Propostas" (`/proposal-history`)
- Consulta todas as propostas já criadas
- Filtros por:
  - Status (pendente, em análise, aceita, recusada, cancelada)
  - Lead específico
  - Busca por código, lead ou imóvel
- Cards de estatísticas:
  - Total de propostas
  - Propostas aceitas
  - Propostas recusadas
  - Propostas pendentes
- Visualização detalhada de cada proposta
- Link direto para detalhes do lead

#### ✅ Funil de Vendas Otimizado
- Agora exibe apenas leads ativos (não finalizados)
- Performance melhorada com filtros no banco de dados
- Leads finalizados não aparecem mais no Kanban

### 3. Navegação

Dois novos itens foram adicionados ao menu lateral:

1. **Clientes** - Ícone `UserCheck`
   - Visualizar todos os clientes finalizados
   - Reativar clientes no funil

2. **Histórico** - Ícone `History`
   - Consultar todas as propostas históricas
   - Análise e estatísticas de propostas

### 4. Fluxo Recomendado

1. **Lead Ativo** → Navega pelo funil de vendas
2. **Chega em "Pós-Venda"** → Botão "Finalizar" disponível
3. **Finalizar Lead** → Move para "Clientes"
4. **Histórico Mantido** → Todas as propostas ficam em "Histórico"
5. **Reativação** (opcional) → Cliente volta ao início do funil

### 5. Vantagens

- ✅ Funil mais limpo e focado em negócios ativos
- ✅ Base de clientes organizada para vendas recorrentes
- ✅ Histórico completo nunca é perdido
- ✅ Fácil reativação de clientes antigos
- ✅ Análise de propostas passadas
- ✅ Nenhuma perda de dados

### 6. Segurança

- Exclusão lógica (não física) dos leads finalizados
- Propostas mantidas no banco mesmo após finalização
- RLS policies devem ser mantidas para proteção dos dados
