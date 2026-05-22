import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { Usuario, type TipoUsuario } from '../../entidades/Usuario.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import { gerarHashSenha, validarSenha } from '../autenticacao/senhas.js';
import type {
  AtualizarUsuarioEntrada,
  CriarUsuarioEntrada,
  ListarUsuariosFiltros,
  UsuarioNormalizado,
  UsuariosServicoContrato
} from './usuariosTipos.js';

const tiposCadastroUsuario: TipoUsuario[] = ['responsavel', 'administrador'];
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regexData = /^\d{4}-\d{2}-\d{2}$/;

export class UsuariosServico implements UsuariosServicoContrato {
  constructor(private readonly usuariosRepositorio: Repository<Usuario>) {}

  public async listar(
    filtros: ListarUsuariosFiltros = {}
  ): Promise<Usuario[]> {
    const where: FindOptionsWhere<Usuario> = { ativo: true };

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    return this.usuariosRepositorio.find({
      where,
      order: { nome: 'ASC' }
    });
  }

  public async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepositorio.findOne({
      where: { id, ativo: true }
    });

    if (!usuario) {
      throw new ErroHttp(404, 'Usuario nao encontrado');
    }

    return usuario;
  }

  public async criar(entrada: CriarUsuarioEntrada): Promise<Usuario> {
    const dados = await this.normalizarUsuario(entrada);
    await this.garantirEmailDisponivel(dados.email);
    await this.garantirCpfDisponivel(dados.cpf);

    const usuario = this.usuariosRepositorio.create(dados);

    return this.usuariosRepositorio.save(usuario);
  }

  public async atualizar(
    id: string,
    entrada: AtualizarUsuarioEntrada
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    const dados = await this.normalizarUsuario(entrada, usuario);

    if (dados.email !== usuario.email) {
      await this.garantirEmailDisponivel(dados.email, usuario.id);
    }

    if (dados.cpf !== usuario.cpf) {
      await this.garantirCpfDisponivel(dados.cpf, usuario.id);
    }

    Object.assign(usuario, dados);

    return this.usuariosRepositorio.save(usuario);
  }

  public async remover(id: string): Promise<void> {
    const usuario = await this.buscarPorId(id);
    usuario.ativo = false;

    await this.usuariosRepositorio.save(usuario);
  }

  private async normalizarUsuario(
    entrada: CriarUsuarioEntrada | AtualizarUsuarioEntrada,
    usuarioAtual?: Usuario
  ): Promise<UsuarioNormalizado> {
    return {
      nome: this.validarTextoObrigatorio(
        'nome',
        entrada.nome ?? usuarioAtual?.nome,
        120
      ),
      cpf: this.validarCpf(
        this.obterValorCadastroObrigatorio('cpf', entrada.cpf, usuarioAtual?.cpf)
      ),
      email: this.validarEmail(entrada.email ?? usuarioAtual?.email),
      telefone: this.validarTextoOpcional(
        'telefone',
        entrada.telefone ?? usuarioAtual?.telefone ?? null,
        30
      ),
      dataNascimento: this.validarDataNascimento(
        this.obterValorCadastroObrigatorio(
          'dataNascimento',
          entrada.dataNascimento,
          usuarioAtual?.dataNascimento
        )
      ),
      enderecoRua: this.validarTextoObrigatorio(
        'enderecoRua',
        this.obterValorCadastroObrigatorio(
          'enderecoRua',
          entrada.enderecoRua,
          usuarioAtual?.enderecoRua
        ),
        160
      ),
      enderecoEstado: this.validarEstado(
        this.obterValorCadastroObrigatorio(
          'enderecoEstado',
          entrada.enderecoEstado,
          usuarioAtual?.enderecoEstado
        )
      ),
      enderecoCidade: this.validarTextoObrigatorio(
        'enderecoCidade',
        this.obterValorCadastroObrigatorio(
          'enderecoCidade',
          entrada.enderecoCidade,
          usuarioAtual?.enderecoCidade
        ),
        120
      ),
      enderecoCep: this.validarCep(
        this.obterValorCadastroObrigatorio(
          'enderecoCep',
          entrada.enderecoCep,
          usuarioAtual?.enderecoCep
        )
      ),
      enderecoComplemento: this.validarTextoOpcional(
        'enderecoComplemento',
        entrada.enderecoComplemento ??
          usuarioAtual?.enderecoComplemento ??
          null,
        120
      ),
      senhaHash: await this.normalizarSenha(entrada, usuarioAtual),
      tipo: this.validarTipo(entrada.tipo ?? usuarioAtual?.tipo),
      recebeNotificacoes: this.validarBooleano(
        'recebeNotificacoes',
        entrada.recebeNotificacoes ??
          usuarioAtual?.recebeNotificacoes ??
          false
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarUsuarioEntrada).ativo ?? usuarioAtual?.ativo ?? true
      )
    };
  }

  private async normalizarSenha(
    entrada: CriarUsuarioEntrada | AtualizarUsuarioEntrada,
    usuarioAtual?: Usuario
  ): Promise<string | null> {
    if (entrada.senha === undefined || entrada.senha === null || entrada.senha === '') {
      if (usuarioAtual) {
        return usuarioAtual.senhaHash;
      }

      throw new ErroHttp(400, 'Campo senha e obrigatorio');
    }

    const senha = validarSenha(entrada.senha);

    if (entrada.confirmarSenha !== senha) {
      throw new ErroHttp(400, 'Campo confirmarSenha deve ser igual a senha');
    }

    return gerarHashSenha(senha);
  }

  private async garantirEmailDisponivel(
    email: string,
    usuarioIdAtual?: string
  ): Promise<void> {
    const usuarioComEmail = await this.usuariosRepositorio.findOne({
      where: { email }
    });

    if (usuarioComEmail && usuarioComEmail.id !== usuarioIdAtual) {
      throw new ErroHttp(409, 'Email ja cadastrado');
    }
  }

  private async garantirCpfDisponivel(
    cpf: string | null,
    usuarioIdAtual?: string
  ): Promise<void> {
    if (!cpf) {
      return;
    }

    const usuarioComCpf = await this.usuariosRepositorio.findOne({
      where: { cpf }
    });

    if (usuarioComCpf && usuarioComCpf.id !== usuarioIdAtual) {
      throw new ErroHttp(409, 'CPF ja cadastrado');
    }
  }

  private obterValorCadastroObrigatorio(
    campo: string,
    valorEntrada: unknown,
    valorAtual?: string | null
  ): unknown {
    if (valorEntrada !== undefined) {
      return valorEntrada;
    }

    if (valorAtual !== undefined) {
      return valorAtual;
    }

    throw new ErroHttp(400, `Campo ${campo} e obrigatorio`);
  }

  private validarEmail(valor: unknown): string {
    const email = this.validarTextoObrigatorio('email', valor, 160)
      .toLowerCase();

    if (!regexEmail.test(email)) {
      throw new ErroHttp(400, 'Campo email deve ser um email valido');
    }

    return email;
  }

  private validarCpf(valor: unknown): string {
    const cpf = this.validarTextoObrigatorio('cpf', valor, 14).replace(/\D/g, '');

    if (
      cpf.length !== 11 ||
      /^(\d)\1{10}$/.test(cpf) ||
      !this.cpfTemDigitosVerificadoresValidos(cpf)
    ) {
      throw new ErroHttp(400, 'Campo cpf deve ser um CPF valido');
    }

    return cpf;
  }

  private cpfTemDigitosVerificadoresValidos(cpf: string): boolean {
    const calcularDigito = (tamanho: number): number => {
      const soma = cpf
        .slice(0, tamanho)
        .split('')
        .reduce((total, digito, indice) => {
          return total + Number(digito) * (tamanho + 1 - indice);
        }, 0);
      const resto = (soma * 10) % 11;

      return resto === 10 ? 0 : resto;
    };

    return calcularDigito(9) === Number(cpf[9]) &&
      calcularDigito(10) === Number(cpf[10]);
  }

  private validarCep(valor: unknown): string {
    const cep = this.validarTextoObrigatorio('enderecoCep', valor, 10).replace(
      /\D/g,
      ''
    );

    if (cep.length !== 8) {
      throw new ErroHttp(400, 'Campo enderecoCep deve ter 8 digitos');
    }

    return cep;
  }

  private validarEstado(valor: unknown): string {
    const estado = this.validarTextoObrigatorio('enderecoEstado', valor, 2)
      .toUpperCase();

    if (!/^[A-Z]{2}$/.test(estado)) {
      throw new ErroHttp(400, 'Campo enderecoEstado deve ter 2 letras');
    }

    return estado;
  }

  private validarDataNascimento(valor: unknown): string {
    if (typeof valor !== 'string' || !regexData.test(valor)) {
      throw new ErroHttp(
        400,
        'Campo dataNascimento deve estar no formato YYYY-MM-DD'
      );
    }

    const data = new Date(`${valor}T00:00:00.000Z`);

    if (Number.isNaN(data.getTime()) || valor !== data.toISOString().slice(0, 10)) {
      throw new ErroHttp(400, 'Campo dataNascimento deve ser uma data valida');
    }

    const hoje = new Date();
    const hojeIso = hoje.toISOString().slice(0, 10);

    if (valor > hojeIso) {
      throw new ErroHttp(400, 'Campo dataNascimento nao pode ser futuro');
    }

    return valor;
  }

  public validarTipo(valor: unknown): TipoUsuario {
    if (typeof valor === 'string' && this.eTipoCadastroUsuario(valor)) {
      return valor;
    }

    throw new ErroHttp(
      400,
      `Campo tipo deve ser um destes valores: ${tiposCadastroUsuario.join(', ')}`
    );
  }

  private validarTextoObrigatorio(
    campo: string,
    valor: unknown,
    tamanhoMaximo: number
  ): string {
    if (typeof valor !== 'string') {
      throw new ErroHttp(400, `Campo ${campo} e obrigatorio`);
    }

    const valorNormalizado = valor.trim();

    if (!valorNormalizado) {
      throw new ErroHttp(400, `Campo ${campo} e obrigatorio`);
    }

    if (valorNormalizado.length > tamanhoMaximo) {
      throw new ErroHttp(
        400,
        `Campo ${campo} deve ter no maximo ${tamanhoMaximo} caracteres`
      );
    }

    return valorNormalizado;
  }

  private validarTextoOpcional(
    campo: string,
    valor: unknown,
    tamanhoMaximo: number
  ): string | null {
    if (valor === undefined || valor === null || valor === '') {
      return null;
    }

    if (typeof valor !== 'string') {
      throw new ErroHttp(400, `Campo ${campo} deve ser texto`);
    }

    const valorNormalizado = valor.trim();

    if (!valorNormalizado) {
      return null;
    }

    if (valorNormalizado.length > tamanhoMaximo) {
      throw new ErroHttp(
        400,
        `Campo ${campo} deve ter no maximo ${tamanhoMaximo} caracteres`
      );
    }

    return valorNormalizado;
  }

  private validarBooleano(campo: string, valor: unknown): boolean {
    if (typeof valor !== 'boolean') {
      throw new ErroHttp(400, `Campo ${campo} deve ser booleano`);
    }

    return valor;
  }

  private eTipoCadastroUsuario(valor: string): valor is TipoUsuario {
    return tiposCadastroUsuario.includes(valor as TipoUsuario);
  }
}

export function criarUsuariosServico(): UsuariosServico {
  return new UsuariosServico(AppDataSource.getRepository(Usuario));
}
