import { api } from './api';
import type {
  CriarEventoEntrada,
  Evento,
  ListarEventosFiltros,
} from '@/src/tipos/evento';

export const eventosServico = {
  async listar(filtros: ListarEventosFiltros = {}): Promise<Evento[]> {
    const resposta = await api.get<Evento[]>('/eventos', { params: filtros });
    return resposta.data;
  },

  async buscarPorId(id: string): Promise<Evento> {
    const resposta = await api.get<Evento>(`/eventos/${id}`);
    return resposta.data;
  },

  async criar(entrada: CriarEventoEntrada): Promise<Evento> {
    const resposta = await api.post<Evento>('/eventos', entrada);
    return resposta.data;
  },
};
