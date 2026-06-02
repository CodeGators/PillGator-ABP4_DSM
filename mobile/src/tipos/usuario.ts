import type { TipoUsuario } from './autenticacao';

export type Usuario = {
  id: string;
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
  tipo: TipoUsuario;
  recebeNotificacoes: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type CriarUsuarioEntrada = {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  enderecoRua: string;
  enderecoEstado: string;
  enderecoCidade: string;
  enderecoCep: string;
  enderecoComplemento?: string;
  senha: string;
  confirmarSenha: string;
  tipo: TipoUsuario;
  recebeNotificacoes: boolean;
};
