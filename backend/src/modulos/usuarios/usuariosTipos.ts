import type { TipoUsuario, Usuario } from '../../entidades/Usuario.js';

export type CriarUsuarioEntrada = {
  nome?: unknown;
  cpf?: unknown;
  email?: unknown;
  telefone?: unknown;
  dataNascimento?: unknown;
  enderecoRua?: unknown;
  enderecoEstado?: unknown;
  enderecoCidade?: unknown;
  enderecoCep?: unknown;
  enderecoComplemento?: unknown;
  senha?: unknown;
  confirmarSenha?: unknown;
  tipo?: unknown;
  recebeNotificacoes?: unknown;
};

export type AtualizarUsuarioEntrada = Partial<CriarUsuarioEntrada> & {
  ativo?: unknown;
};

export type ListarUsuariosFiltros = {
  tipo?: TipoUsuario;
};

export type UsuarioNormalizado = {
  nome: string;
  cpf: string | null;
  email: string;
  telefone: string | null;
  dataNascimento: string | null;
  enderecoRua: string | null;
  enderecoEstado: string | null;
  enderecoCidade: string | null;
  enderecoCep: string | null;
  enderecoComplemento: string | null;
  senhaHash: string | null;
  tipo: TipoUsuario;
  recebeNotificacoes: boolean;
  ativo: boolean;
};

export interface UsuariosServicoContrato {
  listar(filtros?: ListarUsuariosFiltros): Promise<Usuario[]>;
  buscarPorId(id: string): Promise<Usuario>;
  criar(entrada: CriarUsuarioEntrada): Promise<Usuario>;
  atualizar(id: string, entrada: AtualizarUsuarioEntrada): Promise<Usuario>;
  remover(id: string): Promise<void>;
}
