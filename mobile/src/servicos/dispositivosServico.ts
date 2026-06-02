import { api } from './api';
import type {
  AtualizarCompartimentoEntrada,
  AtualizarDispositivoEntrada,
  Compartimento,
  ComandoDispositivo,
  CriarCompartimentoEntrada,
  CriarComandoCompartimentoEntrada,
  CriarDispositivoEntrada,
  Dispositivo,
  StatusDispositivo,
} from '@/src/tipos/dispositivo';

export const dispositivosServico = {
  async listar(pacienteId?: string): Promise<Dispositivo[]> {
    const resposta = await api.get<Dispositivo[]>('/dispositivos', {
      params: pacienteId ? { pacienteId } : undefined,
    });

    return resposta.data;
  },

  async buscarPorId(id: string): Promise<Dispositivo> {
    const resposta = await api.get<Dispositivo>(`/dispositivos/${id}`);
    return resposta.data;
  },

  async criar(entrada: CriarDispositivoEntrada): Promise<Dispositivo> {
    const resposta = await api.post<Dispositivo>('/dispositivos', entrada);
    return resposta.data;
  },

  async atualizar(
    id: string,
    entrada: AtualizarDispositivoEntrada
  ): Promise<Dispositivo> {
    const resposta = await api.put<Dispositivo>(`/dispositivos/${id}`, entrada);
    return resposta.data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/dispositivos/${id}`);
  },

  async obterStatus(id: string): Promise<StatusDispositivo> {
    const resposta = await api.get<StatusDispositivo>(`/dispositivos/${id}/status`);
    return resposta.data;
  },

  async listarCompartimentos(dispositivoId: string): Promise<Compartimento[]> {
    const resposta = await api.get<Compartimento[]>(
      `/dispositivos/${dispositivoId}/compartimentos`
    );

    return resposta.data;
  },

  async criarCompartimento(
    dispositivoId: string,
    entrada: CriarCompartimentoEntrada
  ): Promise<Compartimento> {
    const resposta = await api.post<Compartimento>(
      `/dispositivos/${dispositivoId}/compartimentos`,
      entrada
    );

    return resposta.data;
  },

  async atualizarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: AtualizarCompartimentoEntrada
  ): Promise<Compartimento> {
    const resposta = await api.put<Compartimento>(
      `/dispositivos/${dispositivoId}/compartimentos/${compartimentoId}`,
      entrada
    );

    return resposta.data;
  },

  async removerCompartimento(
    dispositivoId: string,
    compartimentoId: string
  ): Promise<void> {
    await api.delete(`/dispositivos/${dispositivoId}/compartimentos/${compartimentoId}`);
  },

  async liberarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: CriarComandoCompartimentoEntrada = {}
  ): Promise<ComandoDispositivo> {
    const resposta = await api.post<ComandoDispositivo>(
      `/dispositivos/${dispositivoId}/compartimentos/${compartimentoId}/liberar`,
      entrada
    );

    return resposta.data;
  },

  async travarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: CriarComandoCompartimentoEntrada = {}
  ): Promise<ComandoDispositivo> {
    const resposta = await api.post<ComandoDispositivo>(
      `/dispositivos/${dispositivoId}/compartimentos/${compartimentoId}/travar`,
      entrada
    );

    return resposta.data;
  },
};
