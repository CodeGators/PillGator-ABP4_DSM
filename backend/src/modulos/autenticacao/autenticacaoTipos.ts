import type { TipoUsuario, Usuario } from '../../entidades/Usuario.js';

export type LoginEntrada = {
  email?: unknown;
  senha?: unknown;
};

export type SolicitarRecuperacaoSenhaEntrada = {
  identificador?: unknown;
};

export type RedefinirSenhaEntrada = {
  identificador?: unknown;
  senha?: unknown;
  confirmarSenha?: unknown;
};

export type UsuarioToken = {
  id: string;
  nome: string;
  email: string;
  dataNascimento: string | null;
  tipo: TipoUsuario;
};

export type TokenPayload = {
  sub: string;
  nome: string;
  email: string;
  dataNascimento: string | null;
  tipo: TipoUsuario;
};

export type LoginResposta = {
  token: string;
  tipoToken: 'Bearer';
  expiraEm: string;
  usuario: UsuarioToken;
};

export type SolicitarRecuperacaoSenhaResposta = {
  mensagem: string;
  identificador: string;
};

export type RedefinirSenhaResposta = {
  mensagem: string;
};

export interface AutenticacaoServicoContrato {
  login(entrada: LoginEntrada): Promise<LoginResposta>;
  solicitarRecuperacaoSenha(
    entrada: SolicitarRecuperacaoSenhaEntrada
  ): Promise<SolicitarRecuperacaoSenhaResposta>;
  redefinirSenha(entrada: RedefinirSenhaEntrada): Promise<RedefinirSenhaResposta>;
  gerarToken(usuario: Usuario): LoginResposta;
  buscarUsuarioAutenticado(id: string): Promise<UsuarioToken>;
}
