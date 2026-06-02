import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import {
  ComandoDispositivo,
  type TipoComandoDispositivo
} from '../../entidades/ComandoDispositivo.js';
import {
  Compartimento,
  type StatusCompartimento
} from '../../entidades/Compartimento.js';
import { Dispositivo } from '../../entidades/Dispositivo.js';
import {
  EventoMedicamento,
  type TipoEventoMedicamento
} from '../../entidades/EventoMedicamento.js';
import { Medicamento } from '../../entidades/Medicamento.js';
import { Paciente } from '../../entidades/Paciente.js';
import { PacienteResponsavel } from '../../entidades/PacienteResponsavel.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import { publicarComando } from '../mqtt/mqttCliente.js';
import type {
  AtualizarCompartimentoEntrada,
  AtualizarDispositivoEntrada,
  CompartimentoNormalizado,
  ContextoUsuarioDispositivo,
  CriarComandoCompartimentoEntrada,
  CriarCompartimentoEntrada,
  CriarDispositivoEntrada,
  DispositivoNormalizado,
  DispositivosServicoContrato,
  ListarDispositivosFiltros,
  RegistrarEventoDispositivoEntrada
} from './dispositivosTipos.js';

const statusCompartimento: StatusCompartimento[] = [
  'bloqueado',
  'liberado',
  'aberto',
  'erro'
];
const tiposEventoDispositivo: TipoEventoMedicamento[] = [
  'compartimento_aberto',
  'compartimento_fechado',
  'medicamento_retirado',
  'falha'
];
const tamanhoMaximoTexto = 120;
const tamanhoMaximoObservacoes = 1000;
const minutosStatusOnline = 5;

export type PublicadorComandoMqtt = (
  dispositivoIdentificador: string,
  comando: string,
  dados: object
) => void;

export class DispositivosServico implements DispositivosServicoContrato {
  constructor(
    private readonly dispositivosRepositorio: Repository<Dispositivo>,
    private readonly compartimentosRepositorio: Repository<Compartimento>,
    private readonly pacientesRepositorio: Repository<Paciente>,
    private readonly medicamentosRepositorio: Repository<Medicamento>,
    private readonly pacientesResponsaveisRepositorio: Repository<PacienteResponsavel>,
    private readonly comandosRepositorio: Repository<ComandoDispositivo>,
    private readonly eventosRepositorio: Repository<EventoMedicamento>,
    private readonly publicarComandoMqtt: PublicadorComandoMqtt = publicarComando
  ) {}

  public async listar(
    filtros: ListarDispositivosFiltros = {},
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Dispositivo[]> {
    const where: FindOptionsWhere<Dispositivo> = { ativo: true };

    if (filtros.pacienteId) {
      await this.garantirAcessoPacienteId(filtros.pacienteId, contexto);
      where.pacienteId = filtros.pacienteId;
    }

    const dispositivos = await this.dispositivosRepositorio.find({
      where,
      order: { nome: 'ASC' }
    });

    if (!contexto || contexto.tipo === 'administrador') {
      return dispositivos;
    }

    const pacienteIds = await this.obterPacienteIdsDoResponsavel(contexto.id);

    return dispositivos.filter((dispositivo) =>
      pacienteIds.includes(dispositivo.pacienteId)
    );
  }

  public async buscarPorId(
    id: string,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Dispositivo> {
    const dispositivo = await this.dispositivosRepositorio.findOne({
      where: { id, ativo: true }
    });

    if (!dispositivo) {
      throw new ErroHttp(404, 'Dispositivo nao encontrado');
    }

    await this.garantirAcessoPacienteId(dispositivo.pacienteId, contexto);

    return dispositivo;
  }

  public async criar(
    entrada: CriarDispositivoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Dispositivo> {
    const dados = await this.normalizarDispositivo(entrada);
    await this.garantirPacienteAtivo(dados.pacienteId);
    await this.garantirAcessoPacienteId(dados.pacienteId, contexto);
    await this.garantirIdentificadorDisponivel(dados.identificador);

    const dispositivo = this.dispositivosRepositorio.create(dados);

    return this.dispositivosRepositorio.save(dispositivo);
  }

  public async atualizar(
    id: string,
    entrada: AtualizarDispositivoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Dispositivo> {
    const dispositivo = await this.buscarPorId(id, contexto);
    const dados = await this.normalizarDispositivo(entrada, dispositivo);

    await this.garantirPacienteAtivo(dados.pacienteId);
    await this.garantirAcessoPacienteId(dados.pacienteId, contexto);

    if (dados.identificador !== dispositivo.identificador) {
      await this.garantirIdentificadorDisponivel(
        dados.identificador,
        dispositivo.id
      );
    }

    Object.assign(dispositivo, dados);

    return this.dispositivosRepositorio.save(dispositivo);
  }

  public async remover(
    id: string,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<void> {
    const dispositivo = await this.buscarPorId(id, contexto);
    dispositivo.ativo = false;

    await this.dispositivosRepositorio.save(dispositivo);
  }

  public async listarCompartimentos(
    dispositivoId: string,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Compartimento[]> {
    await this.buscarPorId(dispositivoId, contexto);

    return this.compartimentosRepositorio.find({
      where: { dispositivoId, ativo: true },
      order: { numero: 'ASC' }
    });
  }

  public async criarCompartimento(
    dispositivoId: string,
    entrada: CriarCompartimentoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Compartimento> {
    const dispositivo = await this.buscarPorId(dispositivoId, contexto);
    const dados = await this.normalizarCompartimento(dispositivo, entrada);
    await this.garantirNumeroDisponivel(dispositivoId, dados.numero);

    const compartimento = this.compartimentosRepositorio.create(dados);

    return this.compartimentosRepositorio.save(compartimento);
  }

  public async atualizarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: AtualizarCompartimentoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Compartimento> {
    const dispositivo = await this.buscarPorId(dispositivoId, contexto);
    const compartimento = await this.buscarCompartimento(
      dispositivoId,
      compartimentoId
    );
    const dados = await this.normalizarCompartimento(
      dispositivo,
      entrada,
      compartimento
    );

    if (dados.numero !== compartimento.numero) {
      await this.garantirNumeroDisponivel(
        dispositivoId,
        dados.numero,
        compartimento.id
      );
    }

    Object.assign(compartimento, dados);

    return this.compartimentosRepositorio.save(compartimento);
  }

  public async removerCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<void> {
    await this.buscarPorId(dispositivoId, contexto);
    const compartimento = await this.buscarCompartimento(
      dispositivoId,
      compartimentoId
    );
    compartimento.ativo = false;

    await this.compartimentosRepositorio.save(compartimento);
  }

  public async liberarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: CriarComandoCompartimentoEntrada = {},
    contexto?: ContextoUsuarioDispositivo
  ): Promise<ComandoDispositivo> {
    return this.criarComandoCompartimento(
      dispositivoId,
      compartimentoId,
      'liberar_gaveta',
      entrada,
      contexto
    );
  }

  public async travarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: CriarComandoCompartimentoEntrada = {},
    contexto?: ContextoUsuarioDispositivo
  ): Promise<ComandoDispositivo> {
    return this.criarComandoCompartimento(
      dispositivoId,
      compartimentoId,
      'travar_gaveta',
      entrada,
      contexto
    );
  }

  public async listarComandosPendentes(
    identificador: string
  ): Promise<ComandoDispositivo[]> {
    const dispositivo = await this.buscarPorIdentificador(identificador);
    dispositivo.ultimoSinalEm = new Date();
    await this.dispositivosRepositorio.save(dispositivo);

    const comandos = await this.comandosRepositorio.find({
      where: { dispositivoId: dispositivo.id, status: 'pendente' },
      order: { criadoEm: 'ASC' },
      relations: { compartimento: true }
    });

    for (const comando of comandos) {
      comando.status = 'enviado';
      comando.enviadoEm = new Date();
      await this.comandosRepositorio.save(comando);
    }

    return comandos;
  }

  public async registrarEventoDispositivo(
    identificador: string,
    entrada: RegistrarEventoDispositivoEntrada
  ): Promise<EventoMedicamento> {
    const dispositivo = await this.buscarPorIdentificador(identificador);
    dispositivo.ultimoSinalEm = new Date();
    await this.dispositivosRepositorio.save(dispositivo);

    const chaveEvento = this.validarTextoObrigatorio(
      'chaveEvento',
      entrada.chaveEvento,
      tamanhoMaximoTexto
    );
    const eventoExistente = await this.buscarEventoPorChave(chaveEvento);

    if (eventoExistente) {
      return eventoExistente;
    }

    const compartimento = await this.obterCompartimentoDoEvento(
      dispositivo.id,
      entrada
    );
    const tipo = this.validarTipoEvento(entrada.tipo);
    const medicamentoId = this.validarTextoOpcional(
      'medicamentoId',
      entrada.medicamentoId ?? compartimento?.medicamentoId ?? null,
      tamanhoMaximoTexto
    );
    const evento = this.eventosRepositorio.create({
      medicamentoId,
      agendamentoId: this.validarTextoOpcional(
        'agendamentoId',
        entrada.agendamentoId,
        tamanhoMaximoTexto
      ),
      dispositivoId: dispositivo.identificador,
      tipo,
      origem: 'iot',
      ocorridoEm: this.validarDataHoraOpcional(
        'ocorridoEm',
        entrada.ocorridoEm
      ) ?? new Date(),
      descricao: this.validarTextoOpcional(
        'descricao',
        entrada.descricao,
        tamanhoMaximoObservacoes
      ),
      dados: {
        ...(this.validarObjetoOpcional(entrada.dados) ?? {}),
        chaveEvento,
        dispositivoBancoId: dispositivo.id,
        compartimentoId: compartimento?.id ?? null,
        compartimentoNumero: compartimento?.numero ?? null
      }
    });

    await this.atualizarCompartimentoPorEvento(compartimento, tipo);

    return this.eventosRepositorio.save(evento);
  }

  public async obterStatus(
    id: string,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<{
    dispositivoId: string;
    identificador: string;
    online: boolean;
    ultimoSinalEm: Date | null;
  }> {
    const dispositivo = await this.buscarPorId(id, contexto);
    const limiteOnline = Date.now() - minutosStatusOnline * 60 * 1000;

    return {
      dispositivoId: dispositivo.id,
      identificador: dispositivo.identificador,
      online: dispositivo.ultimoSinalEm
        ? dispositivo.ultimoSinalEm.getTime() >= limiteOnline
        : false,
      ultimoSinalEm: dispositivo.ultimoSinalEm
    };
  }

  private async criarComandoCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    tipo: TipoComandoDispositivo,
    entrada: CriarComandoCompartimentoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<ComandoDispositivo> {
    const dispositivo = await this.buscarPorId(dispositivoId, contexto);
    const compartimento = await this.buscarCompartimento(
      dispositivoId,
      compartimentoId
    );
    const comando = this.comandosRepositorio.create({
      dispositivoId,
      compartimentoId,
      tipo,
      status: 'pendente',
      enviadoEm: null,
      confirmadoEm: null,
      expiraEm: new Date(Date.now() + 10 * 60 * 1000),
      dados: {
        motivo: this.validarTextoOpcional('motivo', entrada.motivo, 160),
        agendamentoId: this.validarTextoOpcional(
          'agendamentoId',
          entrada.agendamentoId,
          tamanhoMaximoTexto
        ),
        numeroCompartimento: compartimento.numero,
        medicamentoId: compartimento.medicamentoId
      }
    });

    compartimento.status = tipo === 'liberar_gaveta' ? 'liberado' : 'bloqueado';
    await this.compartimentosRepositorio.save(compartimento);

    const comandoSalvo = await this.comandosRepositorio.save(comando);
    this.publicarComandoCompartimentoMqtt(
      dispositivo,
      compartimento,
      comandoSalvo,
      entrada
    );

    return comandoSalvo;
  }

  private publicarComandoCompartimentoMqtt(
    dispositivo: Dispositivo,
    compartimento: Compartimento,
    comando: ComandoDispositivo,
    entrada: CriarComandoCompartimentoEntrada
  ): void {
    const acao = comando.tipo === 'liberar_gaveta' ? 'liberar' : 'bloquear';
    const payload: Record<string, unknown> = {
      acao,
      comandoId: comando.id,
      compartimento: compartimento.numero,
      medicamentoId: compartimento.medicamentoId,
      msgId: comando.id,
    };
    const motivo = this.validarTextoOpcional('motivo', entrada.motivo, 160);
    const agendamentoId = this.validarTextoOpcional(
      'agendamentoId',
      entrada.agendamentoId,
      tamanhoMaximoTexto
    );

    if (motivo) {
      payload.motivo = motivo;
    }

    if (agendamentoId) {
      payload.agendamentoId = agendamentoId;
    }

    try {
      this.publicarComandoMqtt(dispositivo.identificador, acao, payload);
    } catch (erro) {
      console.warn(
        `MQTT: comando ${comando.id} salvo, mas nao foi publicado`,
        erro
      );
    }
  }

  private async normalizarDispositivo(
    entrada: CriarDispositivoEntrada | AtualizarDispositivoEntrada,
    dispositivoAtual?: Dispositivo
  ): Promise<DispositivoNormalizado> {
    return {
      pacienteId: this.validarTextoObrigatorio(
        'pacienteId',
        entrada.pacienteId ?? dispositivoAtual?.pacienteId,
        tamanhoMaximoTexto
      ),
      nome: this.validarTextoObrigatorio(
        'nome',
        entrada.nome ?? dispositivoAtual?.nome,
        tamanhoMaximoTexto
      ),
      identificador: this.validarTextoObrigatorio(
        'identificador',
        entrada.identificador ?? dispositivoAtual?.identificador,
        tamanhoMaximoTexto
      ),
      modelo: this.validarTextoOpcional(
        'modelo',
        entrada.modelo ?? dispositivoAtual?.modelo ?? null,
        tamanhoMaximoTexto
      ),
      ultimoSinalEm: this.validarDataHoraOpcional(
        'ultimoSinalEm',
        entrada.ultimoSinalEm ?? dispositivoAtual?.ultimoSinalEm ?? null
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarDispositivoEntrada).ativo ??
          dispositivoAtual?.ativo ??
          true
      )
    };
  }

  private async normalizarCompartimento(
    dispositivo: Dispositivo,
    entrada: CriarCompartimentoEntrada | AtualizarCompartimentoEntrada,
    compartimentoAtual?: Compartimento
  ): Promise<CompartimentoNormalizado> {
    const medicamentoId = this.validarTextoOpcional(
      'medicamentoId',
      entrada.medicamentoId === undefined
        ? compartimentoAtual?.medicamentoId ?? null
        : entrada.medicamentoId,
      tamanhoMaximoTexto
    );

    await this.garantirMedicamentoDoPaciente(medicamentoId, dispositivo.pacienteId);

    return {
      dispositivoId: dispositivo.id,
      numero: this.validarInteiro(
        'numero',
        entrada.numero ?? compartimentoAtual?.numero,
        1,
        99
      ),
      medicamentoId,
      status: this.validarStatus(
        entrada.status ?? compartimentoAtual?.status ?? 'bloqueado'
      ),
      observacoes: this.validarTextoOpcional(
        'observacoes',
        entrada.observacoes === undefined
          ? compartimentoAtual?.observacoes ?? null
          : entrada.observacoes,
        tamanhoMaximoObservacoes
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarCompartimentoEntrada).ativo ??
          compartimentoAtual?.ativo ??
          true
      )
    };
  }

  private async buscarCompartimento(
    dispositivoId: string,
    compartimentoId: string
  ): Promise<Compartimento> {
    const compartimento = await this.compartimentosRepositorio.findOne({
      where: { id: compartimentoId, dispositivoId, ativo: true }
    });

    if (!compartimento) {
      throw new ErroHttp(404, 'Compartimento nao encontrado');
    }

    return compartimento;
  }

  private async buscarPorIdentificador(
    identificador: string
  ): Promise<Dispositivo> {
    const dispositivo = await this.dispositivosRepositorio.findOne({
      where: { identificador, ativo: true }
    });

    if (!dispositivo) {
      throw new ErroHttp(404, 'Dispositivo nao encontrado');
    }

    return dispositivo;
  }

  private async obterCompartimentoDoEvento(
    dispositivoId: string,
    entrada: RegistrarEventoDispositivoEntrada
  ): Promise<Compartimento | null> {
    const compartimentoId = this.validarTextoOpcional(
      'compartimentoId',
      entrada.compartimentoId,
      tamanhoMaximoTexto
    );

    if (compartimentoId) {
      return this.buscarCompartimento(dispositivoId, compartimentoId);
    }

    if (entrada.compartimentoNumero === undefined || entrada.compartimentoNumero === null) {
      return null;
    }

    const numero = this.validarInteiro('compartimentoNumero', entrada.compartimentoNumero, 1, 99);

    return this.compartimentosRepositorio.findOne({
      where: { dispositivoId, numero, ativo: true }
    });
  }

  private async buscarEventoPorChave(
    chaveEvento: string
  ): Promise<EventoMedicamento | null> {
    const eventos = await this.eventosRepositorio.find({
      where: { origem: 'iot' }
    });

    return eventos.find((evento) => evento.dados?.chaveEvento === chaveEvento) ?? null;
  }

  private async atualizarCompartimentoPorEvento(
    compartimento: Compartimento | null,
    tipo: TipoEventoMedicamento
  ): Promise<void> {
    if (!compartimento) {
      return;
    }

    if (tipo === 'compartimento_aberto') {
      compartimento.status = 'aberto';
    } else if (
      tipo === 'compartimento_fechado' ||
      tipo === 'medicamento_retirado'
    ) {
      compartimento.status = 'bloqueado';
    } else if (tipo === 'falha') {
      compartimento.status = 'erro';
    }

    await this.compartimentosRepositorio.save(compartimento);
  }

  private async garantirPacienteAtivo(pacienteId: string): Promise<void> {
    const paciente = await this.pacientesRepositorio.findOne({
      where: { id: pacienteId, ativo: true }
    });

    if (!paciente) {
      throw new ErroHttp(404, 'Paciente nao encontrado para dispositivo');
    }
  }

  private async garantirMedicamentoDoPaciente(
    medicamentoId: string | null,
    pacienteId: string
  ): Promise<void> {
    if (!medicamentoId) {
      return;
    }

    const medicamento = await this.medicamentosRepositorio.findOne({
      where: { id: medicamentoId, ativo: true }
    });

    if (!medicamento) {
      throw new ErroHttp(404, 'Medicamento nao encontrado para compartimento');
    }

    if (medicamento.pacienteId !== pacienteId) {
      throw new ErroHttp(
        400,
        'Medicamento deve pertencer ao mesmo paciente do dispositivo'
      );
    }
  }

  private async garantirAcessoPacienteId(
    pacienteId: string,
    contexto?: ContextoUsuarioDispositivo
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
      'Usuario sem permissao para acessar dispositivo deste paciente'
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

  private async garantirIdentificadorDisponivel(
    identificador: string,
    dispositivoIdAtual?: string
  ): Promise<void> {
    const dispositivo = await this.dispositivosRepositorio.findOne({
      where: { identificador }
    });

    if (dispositivo && dispositivo.id !== dispositivoIdAtual) {
      throw new ErroHttp(409, 'Identificador de dispositivo ja cadastrado');
    }
  }

  private async garantirNumeroDisponivel(
    dispositivoId: string,
    numero: number,
    compartimentoIdAtual?: string
  ): Promise<void> {
    const compartimento = await this.compartimentosRepositorio.findOne({
      where: { dispositivoId, numero, ativo: true }
    });

    if (compartimento && compartimento.id !== compartimentoIdAtual) {
      throw new ErroHttp(409, 'Numero de compartimento ja cadastrado no dispositivo');
    }
  }

  private validarStatus(valor: unknown): StatusCompartimento {
    if (typeof valor === 'string' && this.eStatusCompartimento(valor)) {
      return valor;
    }

    throw new ErroHttp(
      400,
      `Campo status deve ser um destes valores: ${statusCompartimento.join(', ')}`
    );
  }

  private validarTipoEvento(valor: unknown): TipoEventoMedicamento {
    if (typeof valor === 'string' && this.eTipoEventoDispositivo(valor)) {
      return valor;
    }

    throw new ErroHttp(
      400,
      `Campo tipo deve ser um destes valores: ${tiposEventoDispositivo.join(', ')}`
    );
  }

  private validarDataHoraOpcional(campo: string, valor: unknown): Date | null {
    if (valor === undefined || valor === null || valor === '') {
      return null;
    }

    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? null : valor;
    }

    if (typeof valor !== 'string') {
      throw new ErroHttp(400, `Campo ${campo} deve ser texto em ISO 8601`);
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      throw new ErroHttp(400, `Campo ${campo} deve ser uma data/hora valida`);
    }

    return data;
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

  private validarObjetoOpcional(valor: unknown): Record<string, unknown> | null {
    if (valor === undefined || valor === null) {
      return null;
    }

    if (typeof valor !== 'object' || Array.isArray(valor)) {
      throw new ErroHttp(400, 'Campo dados deve ser objeto');
    }

    return valor as Record<string, unknown>;
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

  private eStatusCompartimento(valor: string): valor is StatusCompartimento {
    return statusCompartimento.includes(valor as StatusCompartimento);
  }

  private eTipoEventoDispositivo(
    valor: string
  ): valor is TipoEventoMedicamento {
    return tiposEventoDispositivo.includes(valor as TipoEventoMedicamento);
  }
}

export function criarDispositivosServico(): DispositivosServico {
  return new DispositivosServico(
    AppDataSource.getRepository(Dispositivo),
    AppDataSource.getRepository(Compartimento),
    AppDataSource.getRepository(Paciente),
    AppDataSource.getRepository(Medicamento),
    AppDataSource.getRepository(PacienteResponsavel),
    AppDataSource.getRepository(ComandoDispositivo),
    AppDataSource.getRepository(EventoMedicamento)
  );
}
