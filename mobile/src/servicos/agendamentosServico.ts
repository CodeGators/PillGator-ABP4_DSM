import { api } from './api';
import type {
  Agendamento,
  AtualizarAgendamentoEntrada,
  CriarAgendamentoEntrada,
  ProximaAdministracao,
} from '@/src/tipos/agendamento';

export const agendamentosServico = {
  async listar(filtros: { pacienteId?: string; medicamentoId?: string } = {}): Promise<Agendamento[]> {
    const resposta = await api.get<Agendamento[]>('/agendamentos', {
      params: {
        pacienteId: filtros.pacienteId,
        medicamentoId: filtros.medicamentoId,
      },
    });

    return resposta.data;
  },

  async listarProximasAdministracoes(
    pacienteId: string,
    data: string
  ): Promise<ProximaAdministracao[]> {
    const resposta = await api.get<ProximaAdministracao[]>(
      '/agendamentos/proximas-administracoes',
      { params: { pacienteId, data } }
    );

    return resposta.data;
  },

  async criar(entrada: CriarAgendamentoEntrada): Promise<Agendamento> {
    const resposta = await api.post<Agendamento>('/agendamentos', entrada);
    return resposta.data;
  },

  async atualizar(
    id: string,
    entrada: AtualizarAgendamentoEntrada
  ): Promise<Agendamento> {
    const resposta = await api.put<Agendamento>(`/agendamentos/${id}`, entrada);
    return resposta.data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/agendamentos/${id}`);
  },
};
