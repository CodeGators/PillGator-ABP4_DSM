import { api } from './api';
import type {
  ListarNotificacoesFiltros,
  Notificacao,
  ProcessarNotificacoesEntrada,
  RegistrarTokenPushEntrada,
  ResultadoProcessamentoNotificacoes,
  ResultadoVerificacaoAtrasos,
  TokenPush,
  VerificarAtrasosEntrada,
} from '@/src/tipos/notificacao';

export const notificacoesServico = {
  async listar(filtros: ListarNotificacoesFiltros = {}): Promise<Notificacao[]> {
    const resposta = await api.get<Notificacao[]>('/notificacoes', { params: filtros });
    return resposta.data;
  },

  async registrarTokenPush(entrada: RegistrarTokenPushEntrada): Promise<TokenPush> {
    const resposta = await api.post<TokenPush>('/notificacoes/tokens-push', entrada);
    return resposta.data;
  },

  async processarProximas(
    entrada: ProcessarNotificacoesEntrada = {}
  ): Promise<ResultadoProcessamentoNotificacoes> {
    const resposta = await api.post<ResultadoProcessamentoNotificacoes>(
      '/notificacoes/processar-proximas',
      entrada
    );

    return resposta.data;
  },

  async verificarAtrasos(
    entrada: VerificarAtrasosEntrada = {}
  ): Promise<ResultadoVerificacaoAtrasos> {
    const resposta = await api.post<ResultadoVerificacaoAtrasos>(
      '/notificacoes/verificar-atrasos',
      entrada
    );

    return resposta.data;
  },
};
