import type { StatusNotificacao, Notificacao } from '../../entidades/Notificacao.js';
import type { PlataformaPush, TokenPush } from '../../entidades/TokenPush.js';

export type ListarNotificacoesFiltros = {
  pacienteId?: string;
  responsavelId?: string;
  status?: StatusNotificacao;
};

export type VerificarAtrasosEntrada = {
  referenciaEm?: unknown;
};

export type RegistrarTokenPushEntrada = {
  responsavelId?: unknown;
  token?: unknown;
  plataforma?: unknown;
  dispositivoNome?: unknown;
};

export type ProcessarNotificacoesEntrada = {
  referenciaEm?: unknown;
  antecedenciaMinutos?: unknown;
  janelaMinutos?: unknown;
};

export type ContextoUsuarioNotificacao = {
  id: string;
  tipo: 'responsavel' | 'administrador';
};

export type ResultadoVerificacaoAtrasos = {
  referenciaEm: string;
  atrasosDetectados: number;
  eventosCriados: number;
  notificacoesCriadas: number;
};

export type ResultadoProcessamentoNotificacoes = {
  referenciaEm: string;
  notificacoesCriadas: number;
  notificacoesEnviadas: number;
  notificacoesComErro: number;
};

export type ResultadoEnvioPush = {
  sucesso: boolean;
  detalhes?: unknown;
  erro?: string;
};

export type MensagemPush = {
  tokens: string[];
  titulo: string;
  mensagem: string;
  dados?: Record<string, unknown>;
};

export type TokenPushNormalizado = {
  responsavelId: string;
  token: string;
  plataforma: PlataformaPush;
  dispositivoNome: string | null;
  ativo: boolean;
  ultimoRegistroEm: Date;
};

export interface EnviadorPush {
  enviar(mensagem: MensagemPush): Promise<ResultadoEnvioPush>;
}

export interface NotificacoesServicoContrato {
  listar(filtros?: ListarNotificacoesFiltros): Promise<Notificacao[]>;
  registrarTokenPush(
    entrada: RegistrarTokenPushEntrada,
    contexto?: ContextoUsuarioNotificacao
  ): Promise<TokenPush>;
  processarProximasNotificacoes(
    entrada?: ProcessarNotificacoesEntrada
  ): Promise<ResultadoProcessamentoNotificacoes>;
  verificarAtrasos(
    entrada?: VerificarAtrasosEntrada
  ): Promise<ResultadoVerificacaoAtrasos>;
}
