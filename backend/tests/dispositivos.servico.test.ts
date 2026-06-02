import { jest } from '@jest/globals';
import type { Repository } from 'typeorm';

import { ComandoDispositivo } from '../src/entidades/ComandoDispositivo.js';
import { Compartimento } from '../src/entidades/Compartimento.js';
import { Dispositivo } from '../src/entidades/Dispositivo.js';
import { EventoMedicamento } from '../src/entidades/EventoMedicamento.js';
import { Medicamento } from '../src/entidades/Medicamento.js';
import { Paciente } from '../src/entidades/Paciente.js';
import { PacienteResponsavel } from '../src/entidades/PacienteResponsavel.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import {
  DispositivosServico,
  type PublicadorComandoMqtt
} from '../src/modulos/dispositivos/dispositivosServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioDispositivosMemoria {
  public dispositivos: Dispositivo[] = [];

  public create(dados: Partial<Dispositivo>): Dispositivo {
    return Object.assign(new Dispositivo(), {
      id: `dispositivo-${this.dispositivos.length + 1}`,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(dispositivo: Dispositivo): Promise<Dispositivo> {
    const indice = this.dispositivos.findIndex(
      (item) => item.id === dispositivo.id
    );

    if (indice >= 0) {
      this.dispositivos[indice] = dispositivo;
    } else {
      this.dispositivos.push(dispositivo);
    }

    return dispositivo;
  }

  public async find(opcoes: { where: Partial<Dispositivo> }): Promise<Dispositivo[]> {
    return this.dispositivos.filter((dispositivo) => {
      if (opcoes.where.ativo !== undefined && dispositivo.ativo !== opcoes.where.ativo) {
        return false;
      }

      if (
        opcoes.where.pacienteId !== undefined &&
        dispositivo.pacienteId !== opcoes.where.pacienteId
      ) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<Dispositivo>;
  }): Promise<Dispositivo | null> {
    return (
      this.dispositivos.find((dispositivo) => {
        if (opcoes.where.id !== undefined && dispositivo.id !== opcoes.where.id) {
          return false;
        }

        if (
          opcoes.where.identificador !== undefined &&
          dispositivo.identificador !== opcoes.where.identificador
        ) {
          return false;
        }

        if (
          opcoes.where.ativo !== undefined &&
          dispositivo.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

class RepositorioCompartimentosMemoria {
  public compartimentos: Compartimento[] = [];

  public create(dados: Partial<Compartimento>): Compartimento {
    return Object.assign(new Compartimento(), {
      id: `compartimento-${this.compartimentos.length + 1}`,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(compartimento: Compartimento): Promise<Compartimento> {
    const indice = this.compartimentos.findIndex(
      (item) => item.id === compartimento.id
    );

    if (indice >= 0) {
      this.compartimentos[indice] = compartimento;
    } else {
      this.compartimentos.push(compartimento);
    }

    return compartimento;
  }

  public async find(opcoes: {
    where: Partial<Compartimento>;
  }): Promise<Compartimento[]> {
    return this.compartimentos.filter((compartimento) => {
      if (
        opcoes.where.dispositivoId !== undefined &&
        compartimento.dispositivoId !== opcoes.where.dispositivoId
      ) {
        return false;
      }

      if (opcoes.where.ativo !== undefined && compartimento.ativo !== opcoes.where.ativo) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<Compartimento>;
  }): Promise<Compartimento | null> {
    return (
      this.compartimentos.find((compartimento) => {
        if (opcoes.where.id !== undefined && compartimento.id !== opcoes.where.id) {
          return false;
        }

        if (
          opcoes.where.dispositivoId !== undefined &&
          compartimento.dispositivoId !== opcoes.where.dispositivoId
        ) {
          return false;
        }

        if (
          opcoes.where.numero !== undefined &&
          compartimento.numero !== opcoes.where.numero
        ) {
          return false;
        }

        if (
          opcoes.where.ativo !== undefined &&
          compartimento.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

class RepositorioPacientesMemoria {
  public pacientes: Paciente[] = [];

  public async findOne(opcoes: {
    where: { id: string; ativo: boolean };
  }): Promise<Paciente | null> {
    return (
      this.pacientes.find(
        (paciente) =>
          paciente.id === opcoes.where.id && paciente.ativo === opcoes.where.ativo
      ) ?? null
    );
  }
}

class RepositorioMedicamentosMemoria {
  public medicamentos: Medicamento[] = [];

  public async findOne(opcoes: {
    where: { id: string; ativo: boolean };
  }): Promise<Medicamento | null> {
    return (
      this.medicamentos.find(
        (medicamento) =>
          medicamento.id === opcoes.where.id &&
          medicamento.ativo === opcoes.where.ativo
      ) ?? null
    );
  }
}

class RepositorioPacientesResponsaveisMemoria {
  public vinculos: PacienteResponsavel[] = [];

  public async find(opcoes: {
    where: Partial<PacienteResponsavel>;
  }): Promise<PacienteResponsavel[]> {
    return this.vinculos.filter((vinculo) => {
      if (
        opcoes.where.responsavelId !== undefined &&
        vinculo.responsavelId !== opcoes.where.responsavelId
      ) {
        return false;
      }

      if (opcoes.where.ativo !== undefined && vinculo.ativo !== opcoes.where.ativo) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<PacienteResponsavel>;
  }): Promise<PacienteResponsavel | null> {
    return (
      this.vinculos.find((vinculo) => {
        if (
          opcoes.where.pacienteId !== undefined &&
          vinculo.pacienteId !== opcoes.where.pacienteId
        ) {
          return false;
        }

        if (
          opcoes.where.responsavelId !== undefined &&
          vinculo.responsavelId !== opcoes.where.responsavelId
        ) {
          return false;
        }

        if (
          opcoes.where.ativo !== undefined &&
          vinculo.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

class RepositorioComandosMemoria {
  public comandos: ComandoDispositivo[] = [];

  public create(dados: Partial<ComandoDispositivo>): ComandoDispositivo {
    return Object.assign(new ComandoDispositivo(), {
      id: `comando-${this.comandos.length + 1}`,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(comando: ComandoDispositivo): Promise<ComandoDispositivo> {
    const indice = this.comandos.findIndex((item) => item.id === comando.id);

    if (indice >= 0) {
      this.comandos[indice] = comando;
    } else {
      this.comandos.push(comando);
    }

    return comando;
  }

  public async find(opcoes: {
    where: Partial<ComandoDispositivo>;
  }): Promise<ComandoDispositivo[]> {
    return this.comandos.filter((comando) => {
      if (
        opcoes.where.dispositivoId !== undefined &&
        comando.dispositivoId !== opcoes.where.dispositivoId
      ) {
        return false;
      }

      if (opcoes.where.status !== undefined && comando.status !== opcoes.where.status) {
        return false;
      }

      return true;
    });
  }
}

class RepositorioEventosMemoria {
  public eventos: EventoMedicamento[] = [];

  public create(dados: Partial<EventoMedicamento>): EventoMedicamento {
    return Object.assign(new EventoMedicamento(), {
      id: `evento-${this.eventos.length + 1}`,
      criadoEm: dataFixa,
      ...dados
    });
  }

  public async save(evento: EventoMedicamento): Promise<EventoMedicamento> {
    this.eventos.push(evento);

    return evento;
  }

  public async find(opcoes: {
    where: Partial<EventoMedicamento>;
  }): Promise<EventoMedicamento[]> {
    return this.eventos.filter((evento) => {
      if (opcoes.where.origem !== undefined && evento.origem !== opcoes.where.origem) {
        return false;
      }

      return true;
    });
  }
}

function criarPaciente(sobrescritas: Partial<Paciente> = {}): Paciente {
  return Object.assign(new Paciente(), {
    id: 'paciente-1',
    usuarioId: null,
    nome: 'Joao Paciente',
    dataNascimento: null,
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarMedicamento(
  sobrescritas: Partial<Medicamento> = {}
): Medicamento {
  return Object.assign(new Medicamento(), {
    id: 'medicamento-1',
    pacienteId: 'paciente-1',
    nome: 'Dipirona',
    dosagem: '500mg',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServico(publicarComandoMqtt: PublicadorComandoMqtt = () => undefined) {
  const dispositivosRepositorio = new RepositorioDispositivosMemoria();
  const compartimentosRepositorio = new RepositorioCompartimentosMemoria();
  const pacientesRepositorio = new RepositorioPacientesMemoria();
  const medicamentosRepositorio = new RepositorioMedicamentosMemoria();
  const pacientesResponsaveisRepositorio =
    new RepositorioPacientesResponsaveisMemoria();
  const comandosRepositorio = new RepositorioComandosMemoria();
  const eventosRepositorio = new RepositorioEventosMemoria();

  pacientesRepositorio.pacientes.push(criarPaciente());
  medicamentosRepositorio.medicamentos.push(criarMedicamento());

  const servico = new DispositivosServico(
    dispositivosRepositorio as unknown as Repository<Dispositivo>,
    compartimentosRepositorio as unknown as Repository<Compartimento>,
    pacientesRepositorio as unknown as Repository<Paciente>,
    medicamentosRepositorio as unknown as Repository<Medicamento>,
    pacientesResponsaveisRepositorio as unknown as Repository<PacienteResponsavel>,
    comandosRepositorio as unknown as Repository<ComandoDispositivo>,
    eventosRepositorio as unknown as Repository<EventoMedicamento>,
    publicarComandoMqtt
  );

  return {
    compartimentosRepositorio,
    comandosRepositorio,
    dispositivosRepositorio,
    eventosRepositorio,
    medicamentosRepositorio,
    pacientesRepositorio,
    servico
  };
}

describe('DispositivosServico', () => {
  it('deve criar dispositivo vinculado a paciente ativo', async () => {
    const { servico } = criarServico();

    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: ' PillGator Quarto ',
      identificador: ' pillgator-01 ',
      modelo: 'Prototipo DSM'
    });

    expect(dispositivo).toMatchObject({
      pacienteId: 'paciente-1',
      nome: 'PillGator Quarto',
      identificador: 'pillgator-01',
      modelo: 'Prototipo DSM',
      ultimoSinalEm: null,
      ativo: true
    });
  });

  it('deve rejeitar paciente inexistente ou inativo', async () => {
    const { pacientesRepositorio, servico } = criarServico();
    pacientesRepositorio.pacientes[0]!.ativo = false;

    await expect(
      servico.criar({
        pacienteId: 'paciente-1',
        nome: 'PillGator',
        identificador: 'pillgator-01'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 404,
      message: 'Paciente nao encontrado para dispositivo'
    });
  });

  it('deve rejeitar identificador duplicado', async () => {
    const { servico } = criarServico();

    await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator 1',
      identificador: 'pillgator-01'
    });

    await expect(
      servico.criar({
        pacienteId: 'paciente-1',
        nome: 'PillGator 2',
        identificador: 'pillgator-01'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 409,
      message: 'Identificador de dispositivo ja cadastrado'
    });
  });

  it('deve criar compartimento associado a medicamento ativo', async () => {
    const { servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });

    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1,
      medicamentoId: 'medicamento-1',
      status: 'bloqueado',
      observacoes: 'Compartimento principal'
    });

    expect(compartimento).toMatchObject({
      dispositivoId: dispositivo.id,
      numero: 1,
      medicamentoId: 'medicamento-1',
      status: 'bloqueado',
      observacoes: 'Compartimento principal',
      ativo: true
    });
  });

  it('deve rejeitar medicamento de outro paciente no compartimento', async () => {
    const { medicamentosRepositorio, servico } = criarServico();
    medicamentosRepositorio.medicamentos[0]!.pacienteId = 'paciente-2';
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });

    await expect(
      servico.criarCompartimento(dispositivo.id, {
        numero: 1,
        medicamentoId: 'medicamento-1'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Medicamento deve pertencer ao mesmo paciente do dispositivo'
    });
  });

  it('deve rejeitar numero duplicado de compartimento ativo', async () => {
    const { servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    await servico.criarCompartimento(dispositivo.id, { numero: 1 });

    await expect(
      servico.criarCompartimento(dispositivo.id, { numero: 1 })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 409,
      message: 'Numero de compartimento ja cadastrado no dispositivo'
    });
  });

  it('deve atualizar status do compartimento', async () => {
    const { servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1
    });

    const atualizado = await servico.atualizarCompartimento(
      dispositivo.id,
      compartimento.id,
      { status: 'liberado', medicamentoId: 'medicamento-1' }
    );

    expect(atualizado).toMatchObject({
      status: 'liberado',
      medicamentoId: 'medicamento-1'
    });
  });

  it('deve criar comando para liberar compartimento', async () => {
    const publicarComandoMqtt = jest.fn();
    const { comandosRepositorio, compartimentosRepositorio, servico } =
      criarServico(publicarComandoMqtt);
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1,
      medicamentoId: 'medicamento-1'
    });

    const comando = await servico.liberarCompartimento(
      dispositivo.id,
      compartimento.id,
      { motivo: 'Administrar medicamento' }
    );

    expect(comando).toMatchObject({
      dispositivoId: dispositivo.id,
      compartimentoId: compartimento.id,
      tipo: 'liberar_gaveta',
      status: 'pendente'
    });
    expect(comandosRepositorio.comandos).toHaveLength(1);
    expect(compartimentosRepositorio.compartimentos[0]?.status).toBe('liberado');
    expect(publicarComandoMqtt).toHaveBeenCalledWith(
      'pillgator-01',
      'liberar',
      expect.objectContaining({
        acao: 'liberar',
        compartimento: 1,
        medicamentoId: 'medicamento-1',
        motivo: 'Administrar medicamento'
      })
    );
  });

  it('deve publicar comando mqtt para travar compartimento', async () => {
    const publicarComandoMqtt = jest.fn();
    const { compartimentosRepositorio, servico } = criarServico(publicarComandoMqtt);
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1,
      status: 'liberado'
    });

    const comando = await servico.travarCompartimento(
      dispositivo.id,
      compartimento.id,
      { motivo: 'Teste manual' }
    );

    expect(comando).toMatchObject({
      dispositivoId: dispositivo.id,
      compartimentoId: compartimento.id,
      tipo: 'travar_gaveta',
      status: 'pendente'
    });
    expect(compartimentosRepositorio.compartimentos[0]?.status).toBe('bloqueado');
    expect(publicarComandoMqtt).toHaveBeenCalledWith(
      'pillgator-01',
      'bloquear',
      expect.objectContaining({
        acao: 'bloquear',
        compartimento: 1,
        motivo: 'Teste manual'
      })
    );
  });

  it('deve manter comando salvo quando publicacao mqtt falhar', async () => {
    const publicarComandoMqtt = jest.fn(() => {
      throw new Error('mqtt offline');
    });
    const { comandosRepositorio, servico } = criarServico(publicarComandoMqtt);
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1
    });

    await expect(
      servico.liberarCompartimento(dispositivo.id, compartimento.id, {})
    ).resolves.toMatchObject({
      tipo: 'liberar_gaveta',
      status: 'pendente'
    });
    expect(comandosRepositorio.comandos).toHaveLength(1);
  });

  it('deve listar comandos pendentes e marcar como enviados', async () => {
    const { comandosRepositorio, servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1
    });
    await servico.liberarCompartimento(dispositivo.id, compartimento.id, {});

    const comandos = await servico.listarComandosPendentes('pillgator-01');

    expect(comandos).toHaveLength(1);
    expect(comandosRepositorio.comandos[0]?.status).toBe('enviado');
  });

  it('deve registrar evento iot sem duplicar chave', async () => {
    const { eventosRepositorio, servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    await servico.criarCompartimento(dispositivo.id, {
      numero: 1,
      medicamentoId: 'medicamento-1'
    });
    const entrada = {
      chaveEvento: 'evt-001',
      tipo: 'compartimento_aberto',
      compartimentoNumero: 1,
      ocorridoEm: '2026-01-01T10:00:00.000Z'
    };

    const evento = await servico.registrarEventoDispositivo(
      'pillgator-01',
      entrada
    );
    const repetido = await servico.registrarEventoDispositivo(
      'pillgator-01',
      entrada
    );

    expect(evento.id).toBe(repetido.id);
    expect(eventosRepositorio.eventos).toHaveLength(1);
    expect(evento).toMatchObject({
      tipo: 'compartimento_aberto',
      origem: 'iot',
      medicamentoId: 'medicamento-1'
    });
  });

  it('deve desativar compartimento ao remover', async () => {
    const { compartimentosRepositorio, servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1
    });

    await servico.removerCompartimento(dispositivo.id, compartimento.id);

    expect(compartimentosRepositorio.compartimentos[0]?.ativo).toBe(false);
  });
});
