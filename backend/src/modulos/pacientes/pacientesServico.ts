import type { Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { Paciente } from '../../entidades/Paciente.js';
import { PacienteResponsavel } from '../../entidades/PacienteResponsavel.js';
import { Usuario } from '../../entidades/Usuario.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import { normalizarDataParaBanco } from '../../utils/datas.js';
import type {
  AtualizarPacienteEntrada,
  CriarPacienteEntrada,
  ContextoUsuarioPaciente,
  PacienteNormalizado,
  PacientesServicoContrato,
  VincularResponsavelEntrada,
  VinculoResponsavelNormalizado
} from './pacientesTipos.js';

const tamanhoMaximoTexto = 120;
const tamanhoMaximoParentesco = 80;
const tamanhoMaximoObservacoes = 1000;
const tamanhoMaximoFotoUrl = 2000;

export class PacientesServico implements PacientesServicoContrato {
  constructor(
    private readonly pacientesRepositorio: Repository<Paciente>,
    private readonly usuariosRepositorio: Repository<Usuario>,
    private readonly pacientesResponsaveisRepositorio: Repository<PacienteResponsavel>
  ) {}

  public async listar(
    contexto?: ContextoUsuarioPaciente
  ): Promise<Paciente[]> {
    if (contexto?.tipo === 'responsavel') {
      return this.listarPorResponsavel(contexto.id);
    }

    return this.pacientesRepositorio.find({
      where: { ativo: true },
      order: { nome: 'ASC' }
    });
  }

  public async listarMeus(
    contexto?: ContextoUsuarioPaciente
  ): Promise<Paciente[]> {
    return this.listar(contexto);
  }

  public async buscarPorId(
    id: string,
    contexto?: ContextoUsuarioPaciente
  ): Promise<Paciente> {
    const paciente = await this.pacientesRepositorio.findOne({
      where: { id, ativo: true }
    });

    if (!paciente) {
      throw new ErroHttp(404, 'Paciente nao encontrado');
    }

    await this.garantirAcessoPaciente(paciente, contexto);

    return paciente;
  }

  public async criar(
    entrada: CriarPacienteEntrada,
    contexto?: ContextoUsuarioPaciente
  ): Promise<Paciente> {
    const usuarioDoProprioPaciente = await this.obterUsuarioDoProprioPaciente(
      entrada,
      contexto
    );
    const dados = await this.normalizarPaciente(
      entrada,
      undefined,
      usuarioDoProprioPaciente
    );
    await this.validarUsuarioPaciente(dados.usuarioId);

    const paciente = this.pacientesRepositorio.create(dados);

    const pacienteSalvo = await this.pacientesRepositorio.save(paciente);

    if (contexto?.tipo === 'responsavel') {
      await this.validarUsuarioResponsavel(contexto.id);
      await this.salvarVinculoResponsavel({
        pacienteId: pacienteSalvo.id,
        responsavelId: contexto.id,
        parentesco: null,
        recebeNotificacoes: true,
        ativo: true
      });
    }

    return pacienteSalvo;
  }

  public async atualizar(
    id: string,
    entrada: AtualizarPacienteEntrada,
    contexto?: ContextoUsuarioPaciente
  ): Promise<Paciente> {
    const paciente = await this.buscarPorId(id, contexto);
    const dados = await this.normalizarPaciente(entrada, paciente);

    await this.validarUsuarioPaciente(dados.usuarioId);
    Object.assign(paciente, dados);

    return this.pacientesRepositorio.save(paciente);
  }

  public async remover(
    id: string,
    contexto?: ContextoUsuarioPaciente
  ): Promise<void> {
    const paciente = await this.buscarPorId(id, contexto);
    paciente.ativo = false;

    await this.pacientesRepositorio.save(paciente);
  }

  public async listarResponsaveis(
    pacienteId: string,
    contexto?: ContextoUsuarioPaciente
  ): Promise<PacienteResponsavel[]> {
    await this.buscarPorId(pacienteId, contexto);

    return this.pacientesResponsaveisRepositorio.find({
      where: { pacienteId, ativo: true },
      relations: { responsavel: true },
      order: { criadoEm: 'ASC' }
    });
  }

  public async vincularResponsavel(
    pacienteId: string,
    entrada: VincularResponsavelEntrada,
    contexto?: ContextoUsuarioPaciente
  ): Promise<PacienteResponsavel> {
    await this.buscarPorId(pacienteId, contexto);
    const dados = await this.normalizarVinculoResponsavel(pacienteId, entrada);

    return this.salvarVinculoResponsavel(dados);
  }

  public async removerResponsavel(
    pacienteId: string,
    responsavelId: string,
    contexto?: ContextoUsuarioPaciente
  ): Promise<void> {
    await this.buscarPorId(pacienteId, contexto);

    const vinculo = await this.pacientesResponsaveisRepositorio.findOne({
      where: { pacienteId, responsavelId, ativo: true }
    });

    if (!vinculo) {
      throw new ErroHttp(404, 'Responsavel nao vinculado ao paciente');
    }

    vinculo.ativo = false;
    await this.pacientesResponsaveisRepositorio.save(vinculo);
  }

  private async listarPorResponsavel(responsavelId: string): Promise<Paciente[]> {
    const vinculos = await this.pacientesResponsaveisRepositorio.find({
      where: { responsavelId, ativo: true },
      relations: { paciente: true },
      order: { criadoEm: 'ASC' }
    });

    const pacientes = await Promise.all(
      vinculos.map(async (vinculo) => {
        if (vinculo.paciente?.ativo) {
          return vinculo.paciente;
        }

        return this.pacientesRepositorio.findOne({
          where: { id: vinculo.pacienteId, ativo: true }
        });
      })
    );

    return pacientes
      .filter((paciente): paciente is Paciente => paciente !== null)
      .sort((atual, proximo) => atual.nome.localeCompare(proximo.nome));
  }

  private async garantirAcessoPaciente(
    paciente: Paciente,
    contexto?: ContextoUsuarioPaciente
  ): Promise<void> {
    if (!contexto || contexto.tipo === 'administrador') {
      return;
    }

    if (contexto.tipo === 'responsavel') {
      const vinculo = await this.pacientesResponsaveisRepositorio.findOne({
        where: {
          pacienteId: paciente.id,
          responsavelId: contexto.id,
          ativo: true
        }
      });

      if (vinculo) {
        return;
      }
    }

    throw new ErroHttp(403, 'Usuario sem permissao para acessar este paciente');
  }

  private async salvarVinculoResponsavel(
    dados: VinculoResponsavelNormalizado
  ): Promise<PacienteResponsavel> {
    const vinculoExistente = await this.pacientesResponsaveisRepositorio.findOne({
      where: {
        pacienteId: dados.pacienteId,
        responsavelId: dados.responsavelId
      }
    });

    if (vinculoExistente) {
      Object.assign(vinculoExistente, dados);
      return this.pacientesResponsaveisRepositorio.save(vinculoExistente);
    }

    const vinculo = this.pacientesResponsaveisRepositorio.create(dados);

    return this.pacientesResponsaveisRepositorio.save(vinculo);
  }

  private async normalizarPaciente(
    entrada: CriarPacienteEntrada | AtualizarPacienteEntrada,
    pacienteAtual?: Paciente,
    usuarioDoProprioPaciente?: Usuario
  ): Promise<PacienteNormalizado> {
    if (entrada.usuarioId !== undefined) {
      throw new ErroHttp(
        400,
        'Campo usuarioId nao deve ser enviado. Use souEuMesmo para cadastrar o responsavel logado como paciente.'
      );
    }

    return {
      usuarioId: usuarioDoProprioPaciente?.id ?? pacienteAtual?.usuarioId ?? null,
      nome: this.validarTextoObrigatorio(
        'nome',
        entrada.nome ?? usuarioDoProprioPaciente?.nome ?? pacienteAtual?.nome,
        tamanhoMaximoTexto
      ),
      dataNascimento: this.validarDataOpcional(
        'dataNascimento',
        entrada.dataNascimento === undefined
          ? usuarioDoProprioPaciente?.dataNascimento ??
            pacienteAtual?.dataNascimento ??
            null
          : entrada.dataNascimento
      ),
      observacoes: this.validarTextoOpcional(
        'observacoes',
        entrada.observacoes === undefined
          ? pacienteAtual?.observacoes ?? null
          : entrada.observacoes,
        tamanhoMaximoObservacoes
      ),
      fotoUrl: this.validarTextoOpcional(
        'fotoUrl',
        entrada.fotoUrl === undefined
          ? pacienteAtual?.fotoUrl ?? null
          : entrada.fotoUrl,
        tamanhoMaximoFotoUrl
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarPacienteEntrada).ativo ?? pacienteAtual?.ativo ?? true
      )
    };
  }

  private async normalizarVinculoResponsavel(
    pacienteId: string,
    entrada: VincularResponsavelEntrada
  ): Promise<VinculoResponsavelNormalizado> {
    const responsavelId = this.validarTextoObrigatorio(
      'responsavelId',
      entrada.responsavelId,
      tamanhoMaximoTexto
    );

    await this.validarUsuarioResponsavel(responsavelId);

    return {
      pacienteId,
      responsavelId,
      parentesco: this.validarTextoOpcional(
        'parentesco',
        entrada.parentesco,
        tamanhoMaximoParentesco
      ),
      recebeNotificacoes: this.validarBooleano(
        'recebeNotificacoes',
        entrada.recebeNotificacoes ?? true
      ),
      ativo: true
    };
  }

  private async obterUsuarioDoProprioPaciente(
    entrada: CriarPacienteEntrada,
    contexto?: ContextoUsuarioPaciente
  ): Promise<Usuario | undefined> {
    const souEuMesmo = this.validarBooleanoOpcional(
      'souEuMesmo',
      entrada.souEuMesmo
    );

    if (!souEuMesmo) {
      return undefined;
    }

    if (contexto?.tipo !== 'responsavel') {
      throw new ErroHttp(
        403,
        'Apenas responsavel logado pode se cadastrar como paciente'
      );
    }

    const usuario = await this.usuariosRepositorio.findOne({
      where: { id: contexto.id, ativo: true }
    });

    if (!usuario || usuario.tipo !== 'responsavel') {
      throw new ErroHttp(404, 'Usuario responsavel nao encontrado');
    }

    return usuario;
  }

  private async validarUsuarioPaciente(usuarioId: string | null): Promise<void> {
    if (!usuarioId) {
      return;
    }

    const usuario = await this.usuariosRepositorio.findOne({
      where: { id: usuarioId, ativo: true }
    });

    if (!usuario || usuario.tipo !== 'responsavel') {
      throw new ErroHttp(404, 'Usuario responsavel nao encontrado');
    }
  }

  private async validarUsuarioResponsavel(responsavelId: string): Promise<void> {
    const responsavel = await this.usuariosRepositorio.findOne({
      where: { id: responsavelId, ativo: true }
    });

    if (!responsavel || responsavel.tipo !== 'responsavel') {
      throw new ErroHttp(404, 'Usuario responsavel nao encontrado');
    }
  }

  private validarDataOpcional(campo: string, valor: unknown): string | null {
    return normalizarDataParaBanco(campo, valor);
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

  private validarBooleanoOpcional(campo: string, valor: unknown): boolean {
    if (valor === undefined || valor === null || valor === '') {
      return false;
    }

    return this.validarBooleano(campo, valor);
  }
}

export function criarPacientesServico(): PacientesServico {
  return new PacientesServico(
    AppDataSource.getRepository(Paciente),
    AppDataSource.getRepository(Usuario),
    AppDataSource.getRepository(PacienteResponsavel)
  );
}
