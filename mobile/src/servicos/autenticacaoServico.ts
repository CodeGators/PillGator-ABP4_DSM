import { api } from './api';
import type {
  LoginEntrada,
  LoginResposta,
  RedefinirSenhaEntrada,
  RedefinirSenhaResposta,
  SolicitarRecuperacaoSenhaEntrada,
  SolicitarRecuperacaoSenhaResposta,
  UsuarioAutenticado,
} from '@/src/tipos/autenticacao';

export const autenticacaoServico = {
  async login(entrada: LoginEntrada): Promise<LoginResposta> {
    const resposta = await api.post<LoginResposta>('/auth/login', entrada);
    return resposta.data;
  },

  async me(): Promise<UsuarioAutenticado> {
    const resposta = await api.get<UsuarioAutenticado>('/auth/me');
    return resposta.data;
  },

  async solicitarRecuperacaoSenha(
    entrada: SolicitarRecuperacaoSenhaEntrada
  ): Promise<SolicitarRecuperacaoSenhaResposta> {
    const resposta = await api.post<SolicitarRecuperacaoSenhaResposta>(
      '/auth/recuperar-senha',
      entrada
    );
    return resposta.data;
  },

  async redefinirSenha(
    entrada: RedefinirSenhaEntrada
  ): Promise<RedefinirSenhaResposta> {
    const resposta = await api.post<RedefinirSenhaResposta>(
      '/auth/redefinir-senha',
      entrada
    );
    return resposta.data;
  },
};
