export type TipoEvento =
  | 'alerta_emitido'
  | 'compartimento_aberto'
  | 'compartimento_fechado'
  | 'medicamento_retirado'
  | 'dose_perdida'
  | 'atraso'
  | 'falha';

export type OrigemEvento = 'backend' | 'mobile' | 'iot';

export type Evento = {
  id: string;
  medicamentoId: string | null;
  agendamentoId: string | null;
  dispositivoId: string | null;
  tipo: TipoEvento;
  origem: OrigemEvento;
  ocorridoEm: string;
  descricao: string | null;
  dados: Record<string, unknown> | null;
  criadoEm: string;
};

export type ListarEventosFiltros = {
  medicamentoId?: string;
  agendamentoId?: string;
  dispositivoId?: string;
  tipo?: TipoEvento;
  origem?: OrigemEvento;
};

export type CriarEventoEntrada = {
  medicamentoId?: string | null;
  agendamentoId?: string | null;
  dispositivoId?: string | null;
  tipo: TipoEvento;
  origem?: OrigemEvento;
  ocorridoEm?: string;
  descricao?: string | null;
  dados?: Record<string, unknown> | null;
};
