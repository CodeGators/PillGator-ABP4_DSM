import axios, { AxiosError } from 'axios';

import { ambiente } from '@/src/config/ambiente';
import type { ErroApi, RespostaErroApi } from '@/src/tipos/api';
import { notificarSessaoExpirada, obterTokenAtual } from './sessaoToken';

export const api = axios.create({
  baseURL: ambiente.apiUrl,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = obterTokenAtual();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (erro: AxiosError<RespostaErroApi>) => {
    if (erro.response?.status === 401) {
      notificarSessaoExpirada();
    }

    return Promise.reject(normalizarErroApi(erro));
  }
);

export function normalizarErroApi(erro: unknown): ErroApi {
  if (axios.isAxiosError<RespostaErroApi>(erro)) {
    const status = erro.response?.status ?? 0;
    const dados = erro.response?.data;

    if (!erro.response) {
      return {
        status,
        mensagem:
          erro.code === 'ECONNABORTED'
            ? 'A API demorou para responder. Verifique se o backend esta ligado.'
            : `Nao foi possivel conectar com a API em ${ambiente.apiUrl}. Verifique se o backend esta rodando.`,
        detalhes: erro.message,
      };
    }

    return {
      status,
      mensagem:
        dados?.mensagem ??
        dados?.erro ??
        erro.message ??
        'Nao foi possivel concluir a solicitacao.',
      detalhes: dados?.detalhes ?? dados,
    };
  }

  if (erro instanceof Error) {
    return {
      status: 0,
      mensagem: erro.message,
    };
  }

  return {
    status: 0,
    mensagem: 'Erro inesperado ao comunicar com a API.',
    detalhes: erro,
  };
}
