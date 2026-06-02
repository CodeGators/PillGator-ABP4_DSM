export type StatusCompartimento = 'bloqueado' | 'liberado' | 'aberto' | 'erro';

export type TipoComandoDispositivo = 'liberar_gaveta' | 'travar_gaveta';
export type StatusComandoDispositivo =
  | 'pendente'
  | 'enviado'
  | 'confirmado'
  | 'cancelado';

export type Dispositivo = {
  id: string;
  pacienteId: string;
  nome: string;
  identificador: string;
  modelo: string | null;
  ultimoSinalEm: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type StatusDispositivo = {
  dispositivoId: string;
  identificador: string;
  online: boolean;
  ultimoSinalEm: string | null;
};

export type Compartimento = {
  id: string;
  dispositivoId: string;
  numero: number;
  medicamentoId: string | null;
  status: StatusCompartimento;
  observacoes: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type ComandoDispositivo = {
  id: string;
  dispositivoId: string;
  compartimentoId: string | null;
  tipo: TipoComandoDispositivo;
  status: StatusComandoDispositivo;
  enviadoEm: string | null;
  confirmadoEm: string | null;
  expiraEm: string | null;
  dados: Record<string, unknown> | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type CriarDispositivoEntrada = {
  pacienteId: string;
  nome: string;
  identificador: string;
  modelo?: string | null;
};

export type AtualizarDispositivoEntrada = Partial<CriarDispositivoEntrada> & {
  ativo?: boolean;
};

export type CriarCompartimentoEntrada = {
  numero: number;
  medicamentoId?: string | null;
  status?: StatusCompartimento;
  observacoes?: string | null;
};

export type AtualizarCompartimentoEntrada = Partial<CriarCompartimentoEntrada> & {
  ativo?: boolean;
};

export type CriarComandoCompartimentoEntrada = {
  motivo?: string | null;
  agendamentoId?: string | null;
};
