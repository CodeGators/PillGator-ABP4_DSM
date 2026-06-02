import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { env } from '../../config/env.js';
import { Usuario } from '../../entidades/Usuario.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import { formatarDataParaBr } from '../../utils/datas.js';
import { compararSenha, gerarHashSenha, validarSenha } from './senhas.js';
import type {
  AutenticacaoServicoContrato,
  LoginEntrada,
  LoginResposta,
  RedefinirSenhaEntrada,
  RedefinirSenhaResposta,
  SolicitarRecuperacaoSenhaEntrada,
  SolicitarRecuperacaoSenhaResposta,
  TokenPayload,
  UsuarioToken
} from './autenticacaoTipos.js';

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mensagemIdentificadorNaoEncontrado = 'CPF ou email nao cadastrado';

export class AutenticacaoServico implements AutenticacaoServicoContrato {
  constructor(private readonly usuariosRepositorio: Repository<Usuario>) {}

  public async login(entrada: LoginEntrada): Promise<LoginResposta> {
    const email = this.validarEmail(entrada.email);
    const senha = this.validarSenhaLogin(entrada.senha);
    const usuario = await this.usuariosRepositorio.findOne({
      where: { email, ativo: true }
    });

    if (!usuario?.senhaHash) {
      throw new ErroHttp(401, 'Email ou senha invalidos');
    }

    const senhaCorreta = await compararSenha(senha, usuario.senhaHash);

    if (!senhaCorreta) {
      throw new ErroHttp(401, 'Email ou senha invalidos');
    }

    return this.gerarToken(usuario);
  }

  public async solicitarRecuperacaoSenha(
    entrada: SolicitarRecuperacaoSenhaEntrada
  ): Promise<SolicitarRecuperacaoSenhaResposta> {
    const identificador = this.validarIdentificadorRecuperacao(
      entrada.identificador
    );
    const usuario = await this.buscarUsuarioPorIdentificador(identificador);

    if (!usuario) {
      throw new ErroHttp(404, mensagemIdentificadorNaoEncontrado);
    }

    return {
      identificador,
      mensagem: 'Cadastro encontrado. Informe uma nova senha.'
    };
  }

  public async redefinirSenha(
    entrada: RedefinirSenhaEntrada
  ): Promise<RedefinirSenhaResposta> {
    const identificador = this.validarIdentificadorRecuperacao(
      entrada.identificador
    );
    const senha = validarSenha(entrada.senha);

    if (entrada.confirmarSenha !== senha) {
      throw new ErroHttp(400, 'Campo confirmarSenha deve ser igual a senha');
    }

    const usuario = await this.buscarUsuarioPorIdentificador(identificador);

    if (!usuario) {
      throw new ErroHttp(404, mensagemIdentificadorNaoEncontrado);
    }

    usuario.senhaHash = await gerarHashSenha(senha);

    await this.usuariosRepositorio.save(usuario);

    return { mensagem: 'Senha redefinida com sucesso.' };
  }

  public gerarToken(usuario: Usuario): LoginResposta {
    const payload: TokenPayload = {
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      dataNascimento: usuario.dataNascimento,
      tipo: usuario.tipo
    };
    const expiracao = env.jwtExpiracao as NonNullable<SignOptions['expiresIn']>;
    const opcoesToken: SignOptions = { expiresIn: expiracao };
    const token = jwt.sign(payload, env.jwtSegredo, opcoesToken);

    return {
      token,
      tipoToken: 'Bearer',
      expiraEm: env.jwtExpiracao,
      usuario: this.mapearUsuario(usuario)
    };
  }

  public async buscarUsuarioAutenticado(id: string): Promise<UsuarioToken> {
    const usuario = await this.usuariosRepositorio.findOne({
      where: { id, ativo: true }
    });

    if (!usuario) {
      throw new ErroHttp(404, 'Usuario autenticado nao encontrado');
    }

    return this.mapearUsuario(usuario);
  }

  private mapearUsuario(usuario: Usuario): UsuarioToken {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      dataNascimento: formatarDataParaBr(usuario.dataNascimento),
      tipo: usuario.tipo
    };
  }

  private validarEmail(valor: unknown): string {
    if (typeof valor !== 'string') {
      throw new ErroHttp(400, 'Campo email e obrigatorio');
    }

    const email = valor.trim().toLowerCase();

    if (!regexEmail.test(email)) {
      throw new ErroHttp(400, 'Campo email deve ser um email valido');
    }

    return email;
  }

  private validarSenhaLogin(valor: unknown): string {
    if (typeof valor !== 'string' || !valor) {
      throw new ErroHttp(400, 'Campo senha e obrigatorio');
    }

    return valor;
  }

  private validarIdentificadorRecuperacao(valor: unknown): string {
    if (typeof valor !== 'string' || !valor.trim()) {
      throw new ErroHttp(400, 'Informe email ou CPF cadastrado');
    }

    return valor.trim();
  }

  private async buscarUsuarioPorIdentificador(
    identificador: string
  ): Promise<Usuario | null> {
    if (identificador.includes('@')) {
      const email = this.validarEmail(identificador);

      return this.usuariosRepositorio.findOne({
        where: { email, ativo: true }
      });
    }

    const cpf = identificador.replace(/\D/g, '');

    if (cpf.length !== 11) {
      throw new ErroHttp(404, mensagemIdentificadorNaoEncontrado);
    }

    return this.usuariosRepositorio.findOne({
      where: { cpf, ativo: true }
    });
  }
}

export function criarAutenticacaoServico(): AutenticacaoServico {
  return new AutenticacaoServico(AppDataSource.getRepository(Usuario));
}
