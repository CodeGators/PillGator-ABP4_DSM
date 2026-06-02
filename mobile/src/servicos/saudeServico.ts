import { api } from './api';

export type SaudeResposta = {
  status: 'ok';
};

export const saudeServico = {
  async verificar(): Promise<SaudeResposta> {
    const resposta = await api.get<SaudeResposta>('/saude');
    return resposta.data;
  },
};
