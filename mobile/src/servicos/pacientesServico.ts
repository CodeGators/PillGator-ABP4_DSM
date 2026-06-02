import { api } from './api';
import type {
  AtualizarPacienteEntrada,
  CriarPacienteEntrada,
  Paciente,
  PacienteResponsavel,
} from '@/src/tipos/paciente';

export const pacientesServico = {
  async listarMeus(): Promise<Paciente[]> {
    const resposta = await api.get<Paciente[]>('/pacientes/meus');
    return resposta.data;
  },

  async criar(entrada: CriarPacienteEntrada): Promise<Paciente> {
    const resposta = await api.post<Paciente>('/pacientes', entrada);
    return resposta.data;
  },

  async atualizar(id: string, entrada: AtualizarPacienteEntrada): Promise<Paciente> {
    const resposta = await api.put<Paciente>(`/pacientes/${id}`, entrada);
    return resposta.data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/pacientes/${id}`);
  },

  async listarResponsaveis(pacienteId: string): Promise<PacienteResponsavel[]> {
    const resposta = await api.get<PacienteResponsavel[]>(
      `/pacientes/${pacienteId}/responsaveis`
    );
    return resposta.data;
  },
};
