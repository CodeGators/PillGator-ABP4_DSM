export type TipoUsuario = 'responsavel' | 'administrador';

export type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  dataNascimento: string | null;
  tipo: TipoUsuario;
};

export type LoginEntrada = {
  email: string;
  senha: string;
};

export type LoginResposta = {
  token: string;
  tipoToken: 'Bearer';
  expiraEm: string;
  usuario: UsuarioAutenticado;
};

export type SolicitarRecuperacaoSenhaEntrada = {
  identificador: string;
};

export type SolicitarRecuperacaoSenhaResposta = {
  mensagem: string;
  identificador: string;
};

export type RedefinirSenhaEntrada = {
  identificador: string;
  senha: string;
  confirmarSenha: string;
};

export type RedefinirSenhaResposta = {
  mensagem: string;
};
