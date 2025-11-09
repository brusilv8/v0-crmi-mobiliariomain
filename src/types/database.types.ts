export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at'>
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>
      }
      imoveis: {
        Row: Imovel
        Insert: Omit<Imovel, 'id' | 'created_at'>
        Update: Partial<Omit<Imovel, 'id' | 'created_at'>>
      }
      funil_etapas: {
        Row: FunilEtapa
        Insert: Omit<FunilEtapa, 'id'>
        Update: Partial<Omit<FunilEtapa, 'id'>>
      }
      lead_funil: {
        Row: LeadFunil
        Insert: Omit<LeadFunil, 'id' | 'created_at'>
        Update: Partial<Omit<LeadFunil, 'id' | 'created_at'>>
      }
      funil_regras_transicao: {
        Row: FunilRegraTransicao
        Insert: Omit<FunilRegraTransicao, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FunilRegraTransicao, 'id' | 'created_at' | 'updated_at'>>
      }
      visitas: {
        Row: Visita
        Insert: Omit<Visita, 'id' | 'created_at'>
        Update: Partial<Omit<Visita, 'id' | 'created_at'>>
      }
      propostas: {
        Row: Proposta
        Insert: Omit<Proposta, 'id' | 'created_at'>
        Update: Partial<Omit<Proposta, 'id' | 'created_at'>>
      }
      usuarios: {
        Row: Usuario
        Insert: Omit<Usuario, 'id' | 'created_at'>
        Update: Partial<Omit<Usuario, 'id' | 'created_at'>>
      }
      lead_interacoes: {
        Row: LeadInteracao
        Insert: Omit<LeadInteracao, 'id' | 'created_at'>
        Update: Partial<Omit<LeadInteracao, 'id' | 'created_at'>>
      }
      imovel_midias: {
        Row: ImovelMidia
        Insert: Omit<ImovelMidia, 'id' | 'created_at'>
        Update: Partial<Omit<ImovelMidia, 'id' | 'created_at'>>
      }
      atividades_sistema: {
        Row: AtividadeSistema
        Insert: Omit<AtividadeSistema, 'id' | 'created_at'>
        Update: Partial<Omit<AtividadeSistema, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  origem: string;
  temperatura: 'cold' | 'warm' | 'hot';
  orcamento_min?: number;
  orcamento_max?: number;
  interesse?: string;
  observacoes?: string;
  tags?: string[];
  finalizado?: boolean;
  data_finalizacao?: string;
  created_at: string;
  updated_at?: string;
  ultimo_contato?: string;
}

export interface Imovel {
  id: string;
  tipo: string;
  finalidade: 'venda' | 'aluguel';
  cep: string;
  endereco: string;
  cidade: string;
  estado: string;
  bairro: string;
  numero?: string;
  complemento?: string;
  valor_venda?: number;
  valor_aluguel?: number;
  valor_condominio?: number;
  valor_iptu?: number;
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  area_total?: number;
  area_util?: number;
  descricao?: string;
  caracteristicas?: string[];
  status: 'disponivel' | 'reservado' | 'vendido' | 'alugado';
  imagem_principal?: string;
  created_at: string;
  updated_at?: string;
}

export interface FunilEtapa {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
  descricao?: string;
}

export interface LeadFunil {
  id: string;
  lead_id: string;
  etapa_id: string;
  data_entrada: string;
  created_at: string;
  lead?: Lead;
  etapa?: FunilEtapa;
}

export interface FunilRegraTransicao {
  id: string;
  etapa_origem_id: string;
  etapa_destino_id: string;
  pode_transitar: boolean;
  observacao?: string;
  created_at: string;
  updated_at: string;
  etapa_origem?: FunilEtapa;
  etapa_destino?: FunilEtapa;
}

export interface Visita {
  id: string;
  lead_id: string;
  imovel_id: string;
  corretor_id?: string;
  data_hora: string;
  duracao?: number;
  tipo: 'presencial' | 'virtual';
  status: 'agendada' | 'realizada' | 'cancelada';
  observacoes?: string;
  feedback?: string;
  rating?: number;
  created_at: string;
  updated_at?: string;
  lead?: Lead;
  imovel?: Imovel;
}

export interface Proposta {
  id: string;
  codigo: string;
  lead_id: string;
  imovel_id: string;
  corretor_id?: string;
  valor: number;
  valor_entrada?: number;
  num_parcelas?: number;
  usa_fgts: boolean;
  condicoes_especiais?: string;
  status: 'pendente' | 'em_analise' | 'aceita' | 'recusada' | 'cancelada';
  validade: string;
  finalizada?: boolean;
  created_at: string;
  updated_at?: string;
  lead?: Lead;
  imovel?: Imovel;
}

export interface Usuario {
  id: string;
  auth_id: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  avatar_url?: string;
  cargo?: string;
  ativo: boolean;
  role?: 'admin' | 'supervisor' | 'corretor' | 'assistente';
  created_at: string;
  updated_at?: string;
}

export interface LeadInteracao {
  id: string;
  lead_id: string;
  usuario_id?: string;
  tipo: 'email' | 'telefone' | 'whatsapp' | 'visita' | 'proposta' | 'observacao';
  descricao: string;
  created_at: string;
  lead?: Lead;
  usuario?: Usuario;
}

export interface ImovelMidia {
  id: string;
  imovel_id: string;
  tipo: 'foto' | 'video' | 'tour360' | 'planta';
  url: string;
  ordem?: number;
  is_principal: boolean;
  created_at: string;
}

export interface AtividadeSistema {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  usuario_id?: string;
  lead_id?: string;
  imovel_id?: string;
  proposta_id?: string;
  visita_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  usuario?: Usuario;
  lead?: Lead;
  imovel?: Imovel;
  proposta?: Proposta;
  visita?: Visita;
}
