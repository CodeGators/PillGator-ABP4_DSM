import { api } from './api';
import type { BaseMedicamento } from '@/src/tipos/medicamento';

export const baseMedicamentosServico = {
  async listar(busca?: string): Promise<BaseMedicamento[]> {
    const resposta = await api.get<BaseMedicamento[]>('/base-medicamentos', {
      params: busca?.trim() ? { busca: busca.trim() } : undefined,
    });

    return resposta.data;
  },

  async buscarPorId(id: string): Promise<BaseMedicamento> {
    const resposta = await api.get<BaseMedicamento>(`/base-medicamentos/${id}`);
    return resposta.data;
  },
};
