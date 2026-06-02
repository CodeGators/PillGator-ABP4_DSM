import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { AgendamentoMedicamento } from '../../entidades/AgendamentoMedicamento.js';
import { Medicamento } from '../../entidades/Medicamento.js';
import { PacienteResponsavel } from '../../entidades/PacienteResponsavel.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import {
  formatarDataHoraParaBr,
  normalizarDataParaBanco
} from '../../utils/datas.js';
import type {
  AgendamentoNormalizado,
  AgendamentosServicoContrato,
  AtualizarAgendamentoEntrada,
  ContextoUsuarioAgendamento,
  CriarAgendamentoEntrada,
  ListarAgendamentosFiltros,
  ListarProximasAdministracoesFiltros,
  ProximaAdministracao
} from './agendamentosTipos.js';

const diasSemanaPadrao = [0, 1, 2, 3, 4, 5, 6];
const regexHorario = /^([01]\d|2[0-3]):[0-5]\d$/;
const tamanhoMaximoCuidados = 1000;

export class AgendamentosServico implements AgendamentosServicoContrato {
  constructor(
    private readonly agendamentosRepositorio: Repository<AgendamentoMedicamento>,
    private readonly medicamentosRepositorio: Repository<Medicamento>,
    private readonly pacientesResponsaveisRepositorio: Repository<PacienteResponsavel>
  ) {}

  public async listar(
    filtros: ListarAgendamentosFiltros = {},
    contexto?: ContextoUsuarioAgendamento
  ): Promise<AgendamentoMedicamento[]> {
    const medicamentoId = this.validarTextoOpcional(
      'medicamentoId',
      filtros.medicamentoId,
      80
    );
    const pacienteId = this.validarTextoOpcional(
      'pacienteId',
      filtros.pacienteId,
      36
    );

    if (medicamentoId) {
      const medicamento = await this.garantirMedicamentoAtivo(medicamentoId);
      await this.garantirAcessoMedicamento(medicamento, contexto);
    }

    if (pacienteId) {
      await this.garantirAcessoPacienteId(pacienteId, contexto);
    }

    const where: FindOptionsWhere<AgendamentoMedicamento> = { ativo: true };

    if (medicamentoId) {
      where.medicamentoId = medicamentoId;
    }

    const agendamentos = await this.agendamentosRepositorio.find({
      where,
      relations: { medicamento: true },
      order: {
        medicamentoId: 'ASC',
        criadoEm: 'ASC'
      }
    });

    return this.filtrarPorAcesso(agendamentos, contexto, pacienteId);
  }

  public async listarProximasAdministracoes(
    filtros: ListarProximasAdministracoesFiltros = {},
    contexto?: ContextoUsuarioAgendamento
  ): Promise<ProximaAdministracao[]> {
    const data = this.validarDataOpcional('data', filtros.data) ??
      new Date().toISOString().slice(0, 10);
    const pacienteId = this.validarTextoOpcional(
      'pacienteId',
      filtros.pacienteId,
      36
    );
    const agendamentos = await this.listar({ pacienteId }, contexto);

    return agendamentos
      .flatMap((agendamento) => this.criarAdministracoesDoDia(agendamento, data))
      .sort((atual, proximo) =>
        atual.horarioPrevisto.localeCompare(proximo.horarioPrevisto)
      );
  }

  public async buscarPorId(
    id: string,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<AgendamentoMedicamento> {
    const agendamento = await this.agendamentosRepositorio.findOne({
      where: { id, ativo: true },
      relations: { medicamento: true }
    });

    if (!agendamento) {
      throw new ErroHttp(404, 'Agendamento nao encontrado');
    }

    await this.garantirAcessoAgendamento(agendamento, contexto);

    return agendamento;
  }

  public async criar(
    entrada: CriarAgendamentoEntrada,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<AgendamentoMedicamento> {
    const dados = await this.normalizarAgendamento(
      entrada,
      undefined,
      contexto
    );
    const agendamento = this.agendamentosRepositorio.create(dados);

    return this.agendamentosRepositorio.save(agendamento);
  }

  public async atualizar(
    id: string,
    entrada: AtualizarAgendamentoEntrada,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<AgendamentoMedicamento> {
    const agendamento = await this.buscarPorId(id, contexto);
    const dados = await this.normalizarAgendamento(
      entrada,
      agendamento,
      contexto
    );

    Object.assign(agendamento, dados);

    return this.agendamentosRepositorio.save(agendamento);
  }

  public async remover(
    id: string,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<void> {
    const agendamento = await this.buscarPorId(id, contexto);
    agendamento.ativo = false;

    await this.agendamentosRepositorio.save(agendamento);
  }

  private async normalizarAgendamento(
    entrada: CriarAgendamentoEntrada | AtualizarAgendamentoEntrada,
    agendamentoAtual?: AgendamentoMedicamento,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<AgendamentoNormalizado> {
    const medicamentoId = this.validarTextoObrigatorio(
      'medicamentoId',
      entrada.medicamentoId ?? agendamentoAtual?.medicamentoId,
      80
    );
    const medicamento = await this.garantirMedicamentoAtivo(medicamentoId);
    await this.garantirAcessoMedicamento(medicamento, contexto);

    const tipo = this.validarTipo(entrada.tipo ?? agendamentoAtual?.tipo);
    const diasSemana = this.validarDiasSemana(
      entrada.diasSemana ?? agendamentoAtual?.diasSemana ?? diasSemanaPadrao
    );
    const inicioEm = this.validarDataOpcional(
      'inicioEm',
      entrada.inicioEm === undefined
        ? agendamentoAtual?.inicioEm ?? null
        : entrada.inicioEm
    );
    const fimEm = this.validarDataOpcional(
      'fimEm',
      entrada.fimEm === undefined
        ? agendamentoAtual?.fimEm ?? null
        : entrada.fimEm
    );

    this.validarPeriodo(inicioEm, fimEm);

    const toleranciaMinutos = this.validarInteiro(
      'toleranciaMinutos',
      entrada.toleranciaMinutos ??
        agendamentoAtual?.toleranciaMinutos ??
        30,
      0,
      240
    );

    return {
      medicamentoId,
      tipo,
      diasSemana,
      ...this.validarRegraFrequencia(tipo, entrada, agendamentoAtual),
      inicioEm,
      fimEm,
      toleranciaMinutos,
      cuidados: this.validarTextoOpcional(
        'cuidados',
        entrada.cuidados === undefined
          ? agendamentoAtual?.cuidados ?? null
          : entrada.cuidados,
        tamanhoMaximoCuidados
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarAgendamentoEntrada).ativo ??
          agendamentoAtual?.ativo ??
          true
      )
    };
  }

  private validarRegraFrequencia(
    tipo: string,
    entrada: CriarAgendamentoEntrada | AtualizarAgendamentoEntrada,
    agendamentoAtual?: AgendamentoMedicamento
  ): Pick<
    AgendamentoNormalizado,
    'horarios' | 'intervaloHoras' | 'horarioInicio'
  > {
    if (tipo === 'horarios_fixos') {
      return {
        horarios: this.validarHorarios(
          entrada.horarios ?? agendamentoAtual?.horarios
        ),
        intervaloHoras: null,
        horarioInicio: null
      };
    }

    return {
      horarios: null,
      intervaloHoras: this.validarInteiro(
        'intervaloHoras',
        entrada.intervaloHoras ?? agendamentoAtual?.intervaloHoras,
        1,
        24
      ),
      horarioInicio: this.validarHorario(
        'horarioInicio',
        entrada.horarioInicio ?? agendamentoAtual?.horarioInicio
      )
    };
  }

  private async garantirMedicamentoAtivo(
    medicamentoId: string
  ): Promise<Medicamento> {
    const medicamento = await this.medicamentosRepositorio.findOne({
      where: { id: medicamentoId, ativo: true }
    });

    if (!medicamento) {
      throw new ErroHttp(404, 'Medicamento nao encontrado para agendamento');
    }

    if (!medicamento.pacienteId) {
      throw new ErroHttp(
        400,
        'Medicamento precisa estar vinculado a um paciente para receber agendamento'
      );
    }

    return medicamento;
  }

  private async garantirAcessoAgendamento(
    agendamento: AgendamentoMedicamento,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<void> {
    const medicamento = agendamento.medicamento ??
      await this.garantirMedicamentoAtivo(agendamento.medicamentoId);

    await this.garantirAcessoMedicamento(medicamento, contexto);
  }

  private async garantirAcessoMedicamento(
    medicamento: Medicamento,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<void> {
    if (!medicamento.pacienteId) {
      throw new ErroHttp(
        400,
        'Medicamento precisa estar vinculado a um paciente para receber agendamento'
      );
    }

    await this.garantirAcessoPacienteId(medicamento.pacienteId, contexto);
  }

  private async garantirAcessoPacienteId(
    pacienteId: string,
    contexto?: ContextoUsuarioAgendamento
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
      'Usuario sem permissao para acessar agendamentos deste paciente'
    );
  }

  private async filtrarPorAcesso(
    agendamentos: AgendamentoMedicamento[],
    contexto?: ContextoUsuarioAgendamento,
    pacienteId?: string | null
  ): Promise<AgendamentoMedicamento[]> {
    const pacienteIdsPermitidos = await this.obterPacienteIdsPermitidos(
      contexto,
      pacienteId
    );

    return agendamentos.filter((agendamento) => {
      const idPaciente = agendamento.medicamento?.pacienteId;

      if (!idPaciente) {
        return false;
      }

      if (pacienteId && idPaciente !== pacienteId) {
        return false;
      }

      if (!pacienteIdsPermitidos) {
        return true;
      }

      return pacienteIdsPermitidos.includes(idPaciente);
    });
  }

  private async obterPacienteIdsPermitidos(
    contexto?: ContextoUsuarioAgendamento,
    pacienteId?: string | null
  ): Promise<string[] | null> {
    if (!contexto || contexto.tipo === 'administrador') {
      return pacienteId ? [pacienteId] : null;
    }

    const vinculos = await this.pacientesResponsaveisRepositorio.find({
      where: { responsavelId: contexto.id, ativo: true }
    });

    return vinculos.map((vinculo) => vinculo.pacienteId);
  }

  private criarAdministracoesDoDia(
    agendamento: AgendamentoMedicamento,
    data: string
  ): ProximaAdministracao[] {
    const medicamento = agendamento.medicamento;

    if (!medicamento?.pacienteId || !this.agendamentoValeNaData(agendamento, data)) {
      return [];
    }

    const horarios = agendamento.tipo === 'horarios_fixos'
      ? agendamento.horarios ?? []
      : this.gerarHorariosIntervalo(
          agendamento.horarioInicio,
          agendamento.intervaloHoras
        );

    return horarios.map((horario) => ({
      agendamentoId: agendamento.id,
      medicamentoId: agendamento.medicamentoId,
      pacienteId: medicamento.pacienteId!,
      medicamentoNome: medicamento.nome,
      horarioPrevisto: formatarDataHoraParaBr(`${data}T${horario}:00`),
      tipo: agendamento.tipo,
      cuidados: agendamento.cuidados
    }));
  }

  private agendamentoValeNaData(
    agendamento: AgendamentoMedicamento,
    data: string
  ): boolean {
    if (agendamento.inicioEm && data < agendamento.inicioEm) {
      return false;
    }

    if (agendamento.fimEm && data > agendamento.fimEm) {
      return false;
    }

    const diaSemana = new Date(`${data}T00:00:00.000Z`).getUTCDay();

    return agendamento.diasSemana.includes(diaSemana);
  }

  private gerarHorariosIntervalo(
    horarioInicio: string | null,
    intervaloHoras: number | null
  ): string[] {
    if (!horarioInicio || !intervaloHoras) {
      return [];
    }

    const [horaInicialTexto, minutoInicialTexto] = horarioInicio.split(':');
    const horaInicial = Number(horaInicialTexto);
    const minutoInicial = Number(minutoInicialTexto);
    const horarios: string[] = [];

    for (
      let hora = horaInicial;
      hora < 24;
      hora += intervaloHoras
    ) {
      const horaTexto = String(hora).padStart(2, '0');
      const minutoTexto = String(minutoInicial).padStart(2, '0');
      horarios.push(`${horaTexto}:${minutoTexto}`);
    }

    return horarios;
  }

  private validarTipo(valor: unknown): 'horarios_fixos' | 'intervalo' {
    if (valor === 'horarios_fixos' || valor === 'intervalo') {
      return valor;
    }

    throw new ErroHttp(
      400,
      'Campo tipo deve ser horarios_fixos ou intervalo'
    );
  }

  private validarDiasSemana(valor: unknown): number[] {
    if (!Array.isArray(valor) || valor.length === 0) {
      throw new ErroHttp(400, 'Campo diasSemana deve ter pelo menos um dia');
    }

    const dias = valor.map((dia) =>
      this.validarInteiro('diasSemana', dia, 0, 6)
    );

    return [...new Set(dias)].sort((a, b) => a - b);
  }

  private validarHorarios(valor: unknown): string[] {
    if (!Array.isArray(valor) || valor.length === 0) {
      throw new ErroHttp(400, 'Campo horarios deve ter pelo menos um horario');
    }

    const horarios = valor.map((horario) =>
      this.validarHorario('horarios', horario)
    );

    return [...new Set(horarios)].sort();
  }

  private validarHorario(campo: string, valor: unknown): string {
    if (typeof valor !== 'string' || !regexHorario.test(valor)) {
      throw new ErroHttp(400, `Campo ${campo} deve estar no formato HH:mm`);
    }

    return valor;
  }

  private validarDataOpcional(campo: string, valor: unknown): string | null {
    return normalizarDataParaBanco(campo, valor, { aceitarHora: true });
  }

  private validarPeriodo(inicioEm: string | null, fimEm: string | null): void {
    if (inicioEm && fimEm && fimEm < inicioEm) {
      throw new ErroHttp(400, 'Campo fimEm deve ser maior ou igual a inicioEm');
    }
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

  private validarInteiro(
    campo: string,
    valor: unknown,
    minimo: number,
    maximo: number
  ): number {
    if (typeof valor !== 'number' || !Number.isInteger(valor)) {
      throw new ErroHttp(400, `Campo ${campo} deve ser um numero inteiro`);
    }

    if (valor < minimo || valor > maximo) {
      throw new ErroHttp(
        400,
        `Campo ${campo} deve estar entre ${minimo} e ${maximo}`
      );
    }

    return valor;
  }

  private validarBooleano(campo: string, valor: unknown): boolean {
    if (typeof valor !== 'boolean') {
      throw new ErroHttp(400, `Campo ${campo} deve ser booleano`);
    }

    return valor;
  }
}

export function criarAgendamentosServico(): AgendamentosServico {
  return new AgendamentosServico(
    AppDataSource.getRepository(AgendamentoMedicamento),
    AppDataSource.getRepository(Medicamento),
    AppDataSource.getRepository(PacienteResponsavel)
  );
}
