import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { BaseMedicamento } from '../../entidades/BaseMedicamento.js';
import { Medicamento } from '../../entidades/Medicamento.js';
import { Paciente } from '../../entidades/Paciente.js';
import { PacienteResponsavel } from '../../entidades/PacienteResponsavel.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  AtualizarMedicamentoEntrada,
  ContextoUsuarioMedicamento,
  CriarMedicamentoEntrada,
  ListarMedicamentosFiltros,
  MedicamentosServicoContrato
} from './medicamentosTipos.js';

const tamanhoMaximoNome = 120;
const tamanhoMaximoDosagem = 60;
const tamanhoMaximoQuantidade = 80;
const tamanhoMaximoUnidade = 40;
const tamanhoMaximoObservacoes = 1000;

export class MedicamentosServico implements MedicamentosServicoContrato {
  constructor(
    private readonly medicamentosRepositorio: Repository<Medicamento>,
    private readonly pacientesRepositorio: Repository<Paciente>,
    private readonly pacientesResponsaveisRepositorio: Repository<PacienteResponsavel>,
    private readonly baseMedicamentosRepositorio: Repository<BaseMedicamento>
  ) {}

  public async listar(
    filtros: ListarMedicamentosFiltros = {},
    contexto?: ContextoUsuarioMedicamento
  ): Promise<Medicamento[]> {
    const pacienteId = this.validarTextoOpcional(
      'pacienteId',
      filtros.pacienteId,
      36
    );

    if (contexto?.tipo === 'responsavel') {
      return this.listarPorResponsavel(contexto.id, pacienteId);
    }

    const where: FindOptionsWhere<Medicamento> = { ativo: true };

    if (pacienteId) {
      where.pacienteId = pacienteId;
    }

    return this.medicamentosRepositorio.find({
      where,
      order: { nome: 'ASC' }
    });
  }

  public async buscarPorId(
    id: string,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<Medicamento> {
    const medicamento = await this.medicamentosRepositorio.findOne({
      where: { id, ativo: true }
    });

    if (!medicamento) {
      throw new ErroHttp(404, 'Medicamento nao encontrado');
    }

    await this.garantirAcessoMedicamento(medicamento, contexto);

    return medicamento;
  }

  public async criar(
    entrada: CriarMedicamentoEntrada,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<Medicamento> {
    const paciente = await this.obterPacienteAtivo(entrada.pacienteId);
    await this.garantirAcessoPacienteId(paciente.id, contexto);

    const baseMedicamento = await this.obterBaseMedicamentoOpcional(
      entrada.baseMedicamentoId
    );
    const nomePadrao = baseMedicamento?.nomeProduto;
    const dosagemPadrao = baseMedicamento?.concentracao;

    const medicamento = this.medicamentosRepositorio.create({
      pacienteId: paciente.id,
      baseMedicamentoId: baseMedicamento?.id ?? null,
      nome: this.validarTextoObrigatorio(
        'nome',
        entrada.nome ?? nomePadrao,
        tamanhoMaximoNome
      ),
      dosagem: this.validarTextoObrigatorio(
        'dosagem',
        entrada.dosagem ?? dosagemPadrao,
        tamanhoMaximoDosagem
      ),
      quantidadeAdministrada: this.validarTextoObrigatorio(
        'quantidadeAdministrada',
        entrada.quantidadeAdministrada,
        tamanhoMaximoQuantidade
      ),
      unidadeAdministracao: this.validarTextoObrigatorio(
        'unidadeAdministracao',
        entrada.unidadeAdministracao,
        tamanhoMaximoUnidade
      ),
      observacoes: this.validarObservacoes(entrada.observacoes),
      ativo: true
    });

    return this.medicamentosRepositorio.save(medicamento);
  }

  public async atualizar(
    id: string,
    entrada: AtualizarMedicamentoEntrada,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<Medicamento> {
    const medicamento = await this.buscarPorId(id, contexto);

    if (entrada.baseMedicamentoId !== undefined) {
      const baseMedicamento = await this.obterBaseMedicamentoOpcional(
        entrada.baseMedicamentoId
      );
      medicamento.baseMedicamentoId = baseMedicamento?.id ?? null;

      if (baseMedicamento) {
        medicamento.nome = this.validarTextoObrigatorio(
          'nome',
          entrada.nome ?? baseMedicamento.nomeProduto,
          tamanhoMaximoNome
        );

        if (entrada.dosagem !== undefined || baseMedicamento.concentracao) {
          medicamento.dosagem = this.validarTextoObrigatorio(
            'dosagem',
            entrada.dosagem ?? baseMedicamento.concentracao,
            tamanhoMaximoDosagem
          );
        }
      }
    }

    if (entrada.nome !== undefined) {
      medicamento.nome = this.validarTextoObrigatorio(
        'nome',
        entrada.nome,
        tamanhoMaximoNome
      );
    }

    if (entrada.dosagem !== undefined) {
      medicamento.dosagem = this.validarTextoObrigatorio(
        'dosagem',
        entrada.dosagem,
        tamanhoMaximoDosagem
      );
    }

    if (entrada.quantidadeAdministrada !== undefined) {
      medicamento.quantidadeAdministrada = this.validarTextoObrigatorio(
        'quantidadeAdministrada',
        entrada.quantidadeAdministrada,
        tamanhoMaximoQuantidade
      );
    }

    if (entrada.unidadeAdministracao !== undefined) {
      medicamento.unidadeAdministracao = this.validarTextoObrigatorio(
        'unidadeAdministracao',
        entrada.unidadeAdministracao,
        tamanhoMaximoUnidade
      );
    }

    if (entrada.observacoes !== undefined) {
      medicamento.observacoes = this.validarObservacoes(entrada.observacoes);
    }

    if (entrada.ativo !== undefined) {
      medicamento.ativo = this.validarBooleano('ativo', entrada.ativo);
    }

    return this.medicamentosRepositorio.save(medicamento);
  }

  public async remover(
    id: string,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<void> {
    const medicamento = await this.buscarPorId(id, contexto);
    medicamento.ativo = false;

    await this.medicamentosRepositorio.save(medicamento);
  }

  private async listarPorResponsavel(
    responsavelId: string,
    pacienteId: string | null
  ): Promise<Medicamento[]> {
    if (pacienteId) {
      await this.garantirAcessoPacienteId(pacienteId, {
        id: responsavelId,
        tipo: 'responsavel'
      });

      return this.medicamentosRepositorio.find({
        where: { pacienteId, ativo: true },
        order: { nome: 'ASC' }
      });
    }

    const pacienteIds = await this.obterPacienteIdsDoResponsavel(responsavelId);

    if (pacienteIds.length === 0) {
      return [];
    }

    return this.medicamentosRepositorio.find({
      where: pacienteIds.map((idPaciente) => ({
        pacienteId: idPaciente,
        ativo: true
      })),
      order: { nome: 'ASC' }
    });
  }

  private async obterPacienteAtivo(valor: unknown): Promise<Paciente> {
    const pacienteId = this.validarTextoObrigatorio('pacienteId', valor, 36);
    const paciente = await this.pacientesRepositorio.findOne({
      where: { id: pacienteId, ativo: true }
    });

    if (!paciente) {
      throw new ErroHttp(404, 'Paciente nao encontrado');
    }

    return paciente;
  }

  private async obterBaseMedicamentoOpcional(
    valor: unknown
  ): Promise<BaseMedicamento | null> {
    const baseMedicamentoId = this.validarTextoOpcional(
      'baseMedicamentoId',
      valor,
      36
    );

    if (!baseMedicamentoId) {
      return null;
    }

    const baseMedicamento = await this.baseMedicamentosRepositorio.findOne({
      where: { id: baseMedicamentoId }
    });

    if (!baseMedicamento) {
      throw new ErroHttp(404, 'Medicamento da base nao encontrado');
    }

    return baseMedicamento;
  }

  private async garantirAcessoMedicamento(
    medicamento: Medicamento,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<void> {
    if (!medicamento.pacienteId) {
      if (!contexto || contexto.tipo === 'administrador') {
        return;
      }

      throw new ErroHttp(
        403,
        'Usuario sem permissao para acessar este medicamento'
      );
    }

    await this.garantirAcessoPacienteId(medicamento.pacienteId, contexto);
  }

  private async garantirAcessoPacienteId(
    pacienteId: string,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<void> {
    if (!contexto || contexto.tipo === 'administrador') {
      return;
    }

    const vinculo = await this.pacientesResponsaveisRepositorio.findOne({
      where: {
        pacienteId,
        responsavelId: contexto.id,
        ativo: true
      }
    });

    if (vinculo) {
      return;
    }

    throw new ErroHttp(
      403,
      'Usuario sem permissao para acessar medicamentos deste paciente'
    );
  }

  private async obterPacienteIdsDoResponsavel(
    responsavelId: string
  ): Promise<string[]> {
    const vinculos = await this.pacientesResponsaveisRepositorio.find({
      where: { responsavelId, ativo: true }
    });

    return vinculos.map((vinculo) => vinculo.pacienteId);
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

  private validarObservacoes(valor: unknown): string | null {
    return this.validarTextoOpcional(
      'observacoes',
      valor,
      tamanhoMaximoObservacoes
    );
  }

  private validarBooleano(campo: string, valor: unknown): boolean {
    if (typeof valor !== 'boolean') {
      throw new ErroHttp(400, `Campo ${campo} deve ser booleano`);
    }

    return valor;
  }
}

export function criarMedicamentosServico(): MedicamentosServico {
  return new MedicamentosServico(
    AppDataSource.getRepository(Medicamento),
    AppDataSource.getRepository(Paciente),
    AppDataSource.getRepository(PacienteResponsavel),
    AppDataSource.getRepository(BaseMedicamento)
  );
}
