import { api } from './api';
import type { CriarUsuarioEntrada, Usuario } from '@/src/tipos/usuario';

export const usuariosServico = {
  async criar(entrada: CriarUsuarioEntrada): Promise<Usuario> {
    const resposta = await api.post<Usuario>('/usuarios', entrada);
    return resposta.data;
  },
};
