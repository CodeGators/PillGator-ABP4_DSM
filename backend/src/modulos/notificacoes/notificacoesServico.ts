import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { AgendamentoMedicamento } from '../../entidades/AgendamentoMedicamento.js';
import { EventoMedicamento } from '../../entidades/EventoMedicamento.js';
import { Medicamento } from '../../entidades/Medicamento.js';
import {
  Notificacao,
  type StatusNotificacao,
  type TipoNotificacao
} from '../../entidades/Notificacao.js';
import { PacienteResponsavel } from '../../entidades/PacienteResponsavel.js';
import { TokenPush, type PlataformaPush } from '../../entidades/TokenPush.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import { EnviadorPushExpo } from './enviadorPushExpo.js';
import type {
  ContextoUsuarioNotificacao,
  EnviadorPush,
  ListarNotificacoesFiltros,
  NotificacoesServicoContrato,
  ProcessarNotificacoesEntrada,
  RegistrarTokenPushEntrada,
  ResultadoProcessamentoNotificacoes,
  ResultadoVerificacaoAtrasos,
  TokenPushNormalizado,
  VerificarAtrasosEntrada
} from './notificacoesTipos.js';

type OcorrenciaAgendamento = {
  agendamento: AgendamentoMedicamento;
  medicamento: Medicamento;
  horarioPrevisto: Date;
};

type OcorrenciaAtraso = OcorrenciaAgendamento & {
  limiteEm: Date;
  chaveAtraso: string;
};

type DadosNotificacao = {
  pacienteId: string;
  responsavelId: string;
  medicamentoId: string;
  agendamentoId: string;
  eventoId: string | null;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  dados: Record<string, unknown>;
};

const statusNotificacao: StatusNotificacao[] = ['pendente', 'enviada', 'erro'];
const plataformasPush: PlataformaPush[] = [
  'android',
  'ios',
  'web',
  'desconhecida'
];
const milissegundosPorMinuto = 60 * 1000;
const milissegundosPorHora = 60 * milissegundosPorMinuto;
const antecedenciaPadraoMinutos = 15;
const janelaPadraoMinutos = 5;
const regexTokenExpo = /^(Expo|Exponent)PushToken\[[^\]]+\]$/;

export class NotificacoesServico implements NotificacoesServicoContrato {
  constructor(
    private readonly notificacoesRepositorio: Repository<Notificacao>,
    private readonly agendamentosRepositorio: Repository<AgendamentoMedicamento>,
    private readonly eventosRepositorio: Repository<EventoMedicamento>,
    private readonly responsaveisRepositorio: Repository<PacienteResponsavel>,
    private readonly medicamentosRepositorio: Repository<Medicamento>,
    private readonly tokensPushRepositorio: Repository<TokenPush>,
    private readonly enviadorPush: EnviadorPush
  ) {}

  public async listar(
    filtros: ListarNotificacoesFiltros = {}
  ): Promise<Notificacao[]> {
    const where: FindOptionsWhere<Notificacao> = {};

    if (filtros.pacienteId) {
      where.pacienteId = filtros.pacienteId;
    }

    if (filtros.responsavelId) {
      where.responsavelId = filtros.responsavelId;
    }

    if (filtros.status) {
      where.status = this.validarStatus(filtros.status);
    }

    return this.notificacoesRepositorio.find({
      where,
      order: { criadoEm: 'DESC' }
    });
  }

  public async registrarTokenPush(
    entrada: RegistrarTokenPushEntrada,
    contexto?: ContextoUsuarioNotificacao
  ): Promise<TokenPush> {
    const dados = this.normalizarTokenPush(entrada, contexto);
    const tokenExistente = await this.tokensPushRepositorio.findOne({
      where: { token: dados.token }
    });

    if (tokenExistente) {
      Object.assign(tokenExistente, dados);
      return this.tokensPushRepositorio.save(tokenExistente);
    }

    const tokenPush = this.tokensPushRepositorio.create(dados);

    return this.tokensPushRepositorio.save(tokenPush);
  }

  public async processarProximasNotificacoes(
    entrada: ProcessarNotificacoesEntrada = {}
  ): Promise<ResultadoProcessamentoNotificacoes> {
    const referenciaEm = this.validarReferencia(entrada.referenciaEm);
    const antecedenciaMinutos = this.validarInteiroOpcional(
      'antecedenciaMinutos',
      entrada.antecedenciaMinutos,
      1,
      240,
      antecedenciaPadraoMinutos
    );
    const janelaMinutos = this.validarInteiroOpcional(
      'janelaMinutos',
      entrada.janelaMinutos,
      1,
      60,
      janelaPadraoMinutos
    );
    const ocorrencias = await this.obterOcorrenciasDoDia(referenciaEm);
    let notificacoesCriadas = 0;
    let notificacoesEnviadas = 0;
    let notificacoesComErro = 0;

    for (const ocorrencia of ocorrencias) {
      const tipos = this.obterTiposProximos(
        ocorrencia,
        referenciaEm,
        antecedenciaMinutos,
        janelaMinutos
      );

      for (const tipo of tipos) {
        const resultado = await this.notificarResponsaveisDaOcorrencia(
          ocorrencia,
          tipo,
          null
        );

        notificacoesCriadas += resultado.criadas;
        notificacoesEnviadas += resultado.enviadas;
        notificacoesComErro += resultado.comErro;
      }
    }

    return {
      referenciaEm: referenciaEm.toISOString(),
      notificacoesCriadas,
      notificacoesEnviadas,
      notificacoesComErro
    };
  }

  public async verificarAtrasos(
    entrada: VerificarAtrasosEntrada = {}
  ): Promise<ResultadoVerificacaoAtrasos> {
    const referenciaEm = this.validarReferencia(entrada.referenciaEm);
    const ocorrencias = await this.obterOcorrenciasAtrasadas(referenciaEm);
    let atrasosDetectados = 0;
    let eventosCriados = 0;
    let notificacoesCriadas = 0;

    for (const ocorrencia of ocorrencias) {
      if (await this.foiRetirado(ocorrencia, referenciaEm)) {
        continue;
      }

      if (await this.atrasoJaRegistrado(ocorrencia)) {
        continue;
      }

      atrasosDetectados += 1;

      const evento = await this.registrarEventoAtraso(ocorrencia);
      const resultado = await this.notificarResponsaveisDaOcorrencia(
        ocorrencia,
        'atraso_medicamento',
        evento
      );

      eventosCriados += 1;
      notificacoesCriadas += resultado.criadas;
    }

    return {
      referenciaEm: referenciaEm.toISOString(),
      atrasosDetectados,
      eventosCriados,
      notificacoesCriadas
    };
  }

  private normalizarTokenPush(
    entrada: RegistrarTokenPushEntrada,
    contexto?: ContextoUsuarioNotificacao
  ): TokenPushNormalizado {
    const responsavelId = contexto?.id ??
      this.validarTextoObrigatorio('responsavelId', entrada.responsavelId, 36);

    if (contexto?.tipo === 'administrador' && entrada.responsavelId) {
      return {
        responsavelId: this.validarTextoObrigatorio(
          'responsavelId',
          entrada.responsavelId,
          36
        ),
        token: this.validarTokenExpo(entrada.token),
        plataforma: this.validarPlataforma(entrada.plataforma),
        dispositivoNome: this.validarTextoOpcional(
          'dispositivoNome',
          entrada.dispositivoNome,
          120
        ),
        ativo: true,
        ultimoRegistroEm: new Date()
      };
    }

    return {
      responsavelId,
      token: this.validarTokenExpo(entrada.token),
      plataforma: this.validarPlataforma(entrada.plataforma),
      dispositivoNome: this.validarTextoOpcional(
        'dispositivoNome',
        entrada.dispositivoNome,
        120
      ),
      ativo: true,
      ultimoRegistroEm: new Date()
    };
  }

  private async obterOcorrenciasAtrasadas(
    referenciaEm: Date
  ): Promise<OcorrenciaAtraso[]> {
    const ocorrencias = await this.obterOcorrenciasDoDia(referenciaEm);

    return ocorrencias
      .map((ocorrencia) => {
        const limiteEm = new Date(
          ocorrencia.horarioPrevisto.getTime() +
            ocorrencia.agendamento.toleranciaMinutos * milissegundosPorMinuto
        );

        return {
          ...ocorrencia,
          limiteEm,
          chaveAtraso: `${ocorrencia.agendamento.id}:${ocorrencia.horarioPrevisto.toISOString()}`
        };
      })
      .filter((ocorrencia) => ocorrencia.limiteEm <= referenciaEm);
  }

  private async obterOcorrenciasDoDia(
    referenciaEm: Date
  ): Promise<OcorrenciaAgendamento[]> {
    const agendamentos = await this.agendamentosRepositorio.find({
      where: { ativo: true },
      relations: { medicamento: true },
      order: { criadoEm: 'ASC' }
    });
    const ocorrencias: OcorrenciaAgendamento[] = [];

    for (const agendamento of agendamentos) {
      const medicamento = await this.obterMedicamentoDoAgendamento(agendamento);

      if (!medicamento?.pacienteId || !this.agendamentoValeNaData(agendamento, referenciaEm)) {
        continue;
      }

      for (const horarioPrevisto of this.obterHorariosDoDia(agendamento, referenciaEm)) {
        ocorrencias.push({
          agendamento,
          medicamento,
          horarioPrevisto
        });
      }
    }

    return ocorrencias;
  }

  private obterTiposProximos(
    ocorrencia: OcorrenciaAgendamento,
    referenciaEm: Date,
    antecedenciaMinutos: number,
    janelaMinutos: number
  ): TipoNotificacao[] {
    const avisarAntesEm = new Date(
      ocorrencia.horarioPrevisto.getTime() -
        antecedenciaMinutos * milissegundosPorMinuto
    );
    const fimJanelaHorario = new Date(
      ocorrencia.horarioPrevisto.getTime() + janelaMinutos * milissegundosPorMinuto
    );
    const tipos: TipoNotificacao[] = [];

    if (referenciaEm >= avisarAntesEm && referenciaEm < ocorrencia.horarioPrevisto) {
      tipos.push('antes_horario_medicamento');
    }

    if (referenciaEm >= ocorrencia.horarioPrevisto && referenciaEm < fimJanelaHorario) {
      tipos.push('horario_medicamento');
    }

    return tipos;
  }

  private agendamentoValeNaData(
    agendamento: AgendamentoMedicamento,
    referenciaEm: Date
  ): boolean {
    const dataReferencia = referenciaEm.toISOString().slice(0, 10);
    const diaSemana = referenciaEm.getUTCDay();

    if (!agendamento.diasSemana.includes(diaSemana)) {
      return false;
    }

    if (agendamento.inicioEm && dataReferencia < agendamento.inicioEm) {
      return false;
    }

    if (agendamento.fimEm && dataReferencia > agendamento.fimEm) {
      return false;
    }

    return true;
  }

  private obterHorariosDoDia(
    agendamento: AgendamentoMedicamento,
    referenciaEm: Date
  ): Date[] {
    const dataReferencia = referenciaEm.toISOString().slice(0, 10);

    if (agendamento.tipo === 'horarios_fixos') {
      return (agendamento.horarios ?? []).map((horario) =>
        this.criarDataHorario(dataReferencia, horario)
      );
    }

    if (!agendamento.horarioInicio || !agendamento.intervaloHoras) {
      return [];
    }

    const horarios: Date[] = [];
    const horarioInicial = this.criarDataHorario(
      dataReferencia,
      agendamento.horarioInicio
    );
    const fimDoDia = new Date(`${dataReferencia}T23:59:59.999Z`);

    for (
      let horario = horarioInicial;
      horario <= fimDoDia;
      horario = new Date(
        horario.getTime() + agendamento.intervaloHoras * milissegundosPorHora
      )
    ) {
      horarios.push(horario);
    }

    return horarios;
  }

  private async foiRetirado(
    ocorrencia: OcorrenciaAtraso,
    referenciaEm: Date
  ): Promise<boolean> {
    const eventos = await this.eventosRepositorio.find({
      where: { agendamentoId: ocorrencia.agendamento.id }
    });

    return eventos.some(
      (evento) =>
        evento.tipo === 'medicamento_retirado' &&
        evento.ocorridoEm >= ocorrencia.horarioPrevisto &&
        evento.ocorridoEm <= referenciaEm
    );
  }

  private async atrasoJaRegistrado(
    ocorrencia: OcorrenciaAtraso
  ): Promise<boolean> {
    const eventos = await this.eventosRepositorio.find({
      where: { agendamentoId: ocorrencia.agendamento.id }
    });

    return eventos.some(
      (evento) =>
        evento.tipo === 'atraso' &&
        evento.dados?.chaveAtraso === ocorrencia.chaveAtraso
    );
  }

  private async registrarEventoAtraso(
    ocorrencia: OcorrenciaAtraso
  ): Promise<EventoMedicamento> {
    const evento = this.eventosRepositorio.create({
      medicamentoId: ocorrencia.agendamento.medicamentoId,
      agendamentoId: ocorrencia.agendamento.id,
      dispositivoId: null,
      tipo: 'atraso',
      origem: 'backend',
      ocorridoEm: ocorrencia.limiteEm,
      descricao: 'Medicamento nao retirado dentro da tolerancia.',
      dados: {
        chaveAtraso: ocorrencia.chaveAtraso,
        horarioPrevisto: ocorrencia.horarioPrevisto.toISOString(),
        limiteEm: ocorrencia.limiteEm.toISOString(),
        toleranciaMinutos: ocorrencia.agendamento.toleranciaMinutos
      }
    });

    return this.eventosRepositorio.save(evento);
  }

  private async notificarResponsaveisDaOcorrencia(
    ocorrencia: OcorrenciaAgendamento,
    tipo: TipoNotificacao,
    evento: EventoMedicamento | null
  ): Promise<{
    criadas: number;
    enviadas: number;
    comErro: number;
  }> {
    const pacienteId = ocorrencia.medicamento.pacienteId;

    if (!pacienteId) {
      return { criadas: 0, enviadas: 0, comErro: 0 };
    }

    const responsaveis = await this.responsaveisRepositorio.find({
      where: { pacienteId, ativo: true, recebeNotificacoes: true }
    });
    let criadas = 0;
    let enviadas = 0;
    let comErro = 0;

    for (const responsavel of responsaveis) {
      const chaveNotificacao = this.montarChaveNotificacao(
        tipo,
        ocorrencia,
        responsavel.responsavelId
      );

      if (await this.notificacaoJaExiste(tipo, responsavel.responsavelId, chaveNotificacao)) {
        continue;
      }

      const notificacao = await this.criarEEnviarNotificacao({
        pacienteId,
        responsavelId: responsavel.responsavelId,
        medicamentoId: ocorrencia.agendamento.medicamentoId,
        agendamentoId: ocorrencia.agendamento.id,
        eventoId: evento?.id ?? null,
        tipo,
        titulo: this.montarTitulo(tipo),
        mensagem: this.montarMensagem(tipo, ocorrencia),
        dados: {
          chaveNotificacao,
          horarioPrevisto: ocorrencia.horarioPrevisto.toISOString(),
          tipo
        }
      });

      criadas += 1;

      if (notificacao.status === 'enviada') {
        enviadas += 1;
      } else if (notificacao.status === 'erro') {
        comErro += 1;
      }
    }

    return { criadas, enviadas, comErro };
  }

  private async criarEEnviarNotificacao(
    dados: DadosNotificacao
  ): Promise<Notificacao> {
    const tokens = await this.tokensPushRepositorio.find({
      where: { responsavelId: dados.responsavelId, ativo: true }
    });
    const notificacao = this.notificacoesRepositorio.create({
      pacienteId: dados.pacienteId,
      responsavelId: dados.responsavelId,
      medicamentoId: dados.medicamentoId,
      agendamentoId: dados.agendamentoId,
      eventoId: dados.eventoId,
      tipo: dados.tipo,
      canal: 'push',
      status: 'pendente',
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      enviadaEm: null,
      lidaEm: null,
      dados: dados.dados
    });

    if (tokens.length === 0) {
      notificacao.status = 'erro';
      notificacao.dados = {
        ...dados.dados,
        erro: 'Responsavel sem token push ativo'
      };

      return this.notificacoesRepositorio.save(notificacao);
    }

    const resultado = await this.enviadorPush.enviar({
      tokens: tokens.map((token) => token.token),
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      dados: dados.dados
    });

    notificacao.status = resultado.sucesso ? 'enviada' : 'erro';
    notificacao.enviadaEm = resultado.sucesso ? new Date() : null;
    notificacao.dados = {
      ...dados.dados,
      quantidadeTokens: tokens.length,
      resultadoPush: resultado.detalhes ?? null,
      erroPush: resultado.erro ?? null
    };

    return this.notificacoesRepositorio.save(notificacao);
  }

  private async notificacaoJaExiste(
    tipo: TipoNotificacao,
    responsavelId: string,
    chaveNotificacao: string
  ): Promise<boolean> {
    const notificacoes = await this.notificacoesRepositorio.find({
      where: { tipo, responsavelId }
    });

    return notificacoes.some(
      (notificacao) => notificacao.dados?.chaveNotificacao === chaveNotificacao
    );
  }

  private montarChaveNotificacao(
    tipo: TipoNotificacao,
    ocorrencia: OcorrenciaAgendamento,
    responsavelId: string
  ): string {
    return [
      tipo,
      ocorrencia.agendamento.id,
      responsavelId,
      ocorrencia.horarioPrevisto.toISOString()
    ].join(':');
  }

  private montarTitulo(tipo: TipoNotificacao): string {
    if (tipo === 'antes_horario_medicamento') {
      return 'Medicamento em breve';
    }

    if (tipo === 'horario_medicamento') {
      return 'Hora do medicamento';
    }

    return 'Medicamento em atraso';
  }

  private montarMensagem(
    tipo: TipoNotificacao,
    ocorrencia: OcorrenciaAgendamento
  ): string {
    const nomeMedicamento = `${ocorrencia.medicamento.nome} ${ocorrencia.medicamento.dosagem}`;
    const horario = ocorrencia.horarioPrevisto.toISOString().slice(11, 16);

    if (tipo === 'antes_horario_medicamento') {
      return `${nomeMedicamento} deve ser administrado em breve, as ${horario}.`;
    }

    if (tipo === 'horario_medicamento') {
      return `${nomeMedicamento} deve ser administrado agora, as ${horario}.`;
    }

    return `${nomeMedicamento} estava previsto para ${horario} e nao foi registrado como retirado.`;
  }

  private async obterMedicamentoDoAgendamento(
    agendamento: AgendamentoMedicamento
  ): Promise<Medicamento | null> {
    if (agendamento.medicamento) {
      return agendamento.medicamento;
    }

    return this.medicamentosRepositorio.findOne({
      where: { id: agendamento.medicamentoId, ativo: true }
    });
  }

  private criarDataHorario(data: string, horario: string): Date {
    return new Date(`${data}T${horario}:00.000Z`);
  }

  private validarReferencia(valor: unknown): Date {
    if (valor === undefined || valor === null || valor === '') {
      return new Date();
    }

    if (typeof valor !== 'string') {
      throw new ErroHttp(400, 'Campo referenciaEm deve ser texto em ISO 8601');
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      throw new ErroHttp(400, 'Campo referenciaEm deve ser uma data/hora valida');
    }

    return data;
  }

  private validarTokenExpo(valor: unknown): string {
    const token = this.validarTextoObrigatorio('token', valor, 255);

    if (!regexTokenExpo.test(token)) {
      throw new ErroHttp(
        400,
        'Campo token deve ser um Expo Push Token valido'
      );
    }

    return token;
  }

  private validarStatus(valor: unknown): StatusNotificacao {
    if (typeof valor === 'string' && this.eStatusNotificacao(valor)) {
      return valor;
    }

    throw new ErroHttp(
      400,
      `Filtro status deve ser um destes valores: ${statusNotificacao.join(', ')}`
    );
  }

  private validarPlataforma(valor: unknown): PlataformaPush {
    if (valor === undefined || valor === null || valor === '') {
      return 'desconhecida';
    }

    if (
      typeof valor === 'string' &&
      plataformasPush.includes(valor as PlataformaPush)
    ) {
      return valor as PlataformaPush;
    }

    throw new ErroHttp(
      400,
      `Campo plataforma deve ser um destes valores: ${plataformasPush.join(', ')}`
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

  private validarInteiroOpcional(
    campo: string,
    valor: unknown,
    minimo: number,
    maximo: number,
    padrao: number
  ): number {
    if (valor === undefined || valor === null || valor === '') {
      return padrao;
    }

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

  private eStatusNotificacao(valor: string): valor is StatusNotificacao {
    return statusNotificacao.includes(valor as StatusNotificacao);
  }
}

export function criarNotificacoesServico(): NotificacoesServico {
  return new NotificacoesServico(
    AppDataSource.getRepository(Notificacao),
    AppDataSource.getRepository(AgendamentoMedicamento),
    AppDataSource.getRepository(EventoMedicamento),
    AppDataSource.getRepository(PacienteResponsavel),
    AppDataSource.getRepository(Medicamento),
    AppDataSource.getRepository(TokenPush),
    new EnviadorPushExpo()
  );
}
