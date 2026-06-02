export type TipoNotificacao =
  | 'antes_horario_medicamento'
  | 'horario_medicamento'
  | 'atraso_medicamento';

export type StatusNotificacao = 'pendente' | 'enviada' | 'erro';
export type CanalNotificacao = 'interno' | 'push';
export type PlataformaPush = 'android' | 'ios' | 'web' | 'desconhecida';

export type Notificacao = {
  id: string;
  pacienteId: string;
  responsavelId: string;
  medicamentoId: string | null;
  agendamentoId: string | null;
  eventoId: string | null;
  tipo: TipoNotificacao;
  canal: CanalNotificacao;
  status: StatusNotificacao;
  titulo: string;
  mensagem: string;
  enviadaEm: string | null;
  lidaEm: string | null;
  dados: Record<string, unknown> | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type TokenPush = {
  id: string;
  responsavelId: string;
  token: string;
  plataforma: PlataformaPush;
  dispositivoNome: string | null;
  ativo: boolean;
  ultimoRegistroEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type RegistrarTokenPushEntrada = {
  responsavelId?: string;
  token: string;
  plataforma?: PlataformaPush;
  dispositivoNome?: string | null;
};

export type ListarNotificacoesFiltros = {
  pacienteId?: string;
  responsavelId?: string;
  status?: StatusNotificacao;
};

export type ProcessarNotificacoesEntrada = {
  referenciaEm?: string;
  antecedenciaMinutos?: number;
  janelaMinutos?: number;
};

export type VerificarAtrasosEntrada = {
  referenciaEm?: string;
};

export type ResultadoProcessamentoNotificacoes = {
  referenciaEm: string;
  notificacoesCriadas: number;
  notificacoesEnviadas: number;
  notificacoesComErro: number;
};

export type ResultadoVerificacaoAtrasos = {
  referenciaEm: string;
  atrasosDetectados: number;
  eventosCriados: number;
  notificacoesCriadas: number;
};
