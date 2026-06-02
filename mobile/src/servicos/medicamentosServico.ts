import { api } from './api';
import type {
  AtualizarMedicamentoEntrada,
  CriarMedicamentoEntrada,
  Medicamento,
} from '@/src/tipos/medicamento';

export const medicamentosServico = {
  async listar(pacienteId?: string): Promise<Medicamento[]> {
    const resposta = await api.get<Medicamento[]>('/medicamentos', {
      params: pacienteId ? { pacienteId } : undefined,
    });

    return resposta.data;
  },

  async criar(entrada: CriarMedicamentoEntrada): Promise<Medicamento> {
    const resposta = await api.post<Medicamento>('/medicamentos', entrada);
    return resposta.data;
  },

  async atualizar(
    id: string,
    entrada: AtualizarMedicamentoEntrada
  ): Promise<Medicamento> {
    const resposta = await api.put<Medicamento>(`/medicamentos/${id}`, entrada);
    return resposta.data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/medicamentos/${id}`);
  },
};
