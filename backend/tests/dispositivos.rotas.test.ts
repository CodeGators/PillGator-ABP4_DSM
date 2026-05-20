import request from 'supertest';

import { criarApp } from '../src/app.js';
import type { ComandoDispositivo } from '../src/entidades/ComandoDispositivo.js';
import type { Compartimento } from '../src/entidades/Compartimento.js';
import type { Dispositivo } from '../src/entidades/Dispositivo.js';
import type { EventoMedicamento } from '../src/entidades/EventoMedicamento.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import type { DispositivosServicoContrato } from '../src/modulos/dispositivos/dispositivosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarDispositivoTeste(
  sobrescritas: Partial<Dispositivo> = {}
): Dispositivo {
  return {
    id: 'dispositivo-1',
    pacienteId: 'paciente-1',
    paciente: null as never,
    nome: 'PillGator Quarto',
    identificador: 'pillgator-01',
    modelo: 'Prototipo DSM',
    ultimoSinalEm: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarCompartimentoTeste(
  sobrescritas: Partial<Compartimento> = {}
): Compartimento {
  return {
    id: 'compartimento-1',
    dispositivoId: 'dispositivo-1',
    dispositivo: null as never,
    numero: 1,
    medicamentoId: 'medicamento-1',
    medicamento: null,
    status: 'bloqueado',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarComandoTeste(
  sobrescritas: Partial<ComandoDispositivo> = {}
): ComandoDispositivo {
  return {
    id: 'comando-1',
    dispositivoId: 'dispositivo-1',
    dispositivo: null as never,
    compartimentoId: 'compartimento-1',
    compartimento: null,
    tipo: 'liberar_gaveta',
    status: 'pendente',
    enviadoEm: null,
    confirmadoEm: null,
    expiraEm: null,
    dados: null,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarEventoTeste(
  sobrescritas: Partial<EventoMedicamento> = {}
): EventoMedicamento {
  return {
    id: 'evento-1',
    medicamentoId: 'medicamento-1',
    medicamento: null,
    agendamentoId: null,
    agendamento: null,
    dispositivoId: 'pillgator-01',
    tipo: 'compartimento_aberto',
    origem: 'iot',
    ocorridoEm: dataFixa,
    descricao: null,
    dados: null,
    criadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarServicoMock(
  sobrescritas: Partial<DispositivosServicoContrato> = {}
) {
  const dispositivo = criarDispositivoTeste();
  const compartimento = criarCompartimentoTeste();
  const comando = criarComandoTeste();
  const evento = criarEventoTeste();
  const chamadas = {
    listar: [] as unknown[],
    buscarPorId: [] as string[],
    criar: [] as unknown[],
    atualizar: [] as Array<[string, unknown]>,
    remover: [] as string[],
    listarCompartimentos: [] as string[],
    criarCompartimento: [] as Array<[string, unknown]>,
    atualizarCompartimento: [] as Array<[string, string, unknown]>,
    removerCompartimento: [] as Array<[string, string]>,
    liberarCompartimento: [] as Array<[string, string, unknown]>,
    travarCompartimento: [] as Array<[string, string, unknown]>,
    listarComandosPendentes: [] as string[],
    registrarEventoDispositivo: [] as Array<[string, unknown]>,
    obterStatus: [] as string[]
  };

  const servico: DispositivosServicoContrato = {
    listar: async (filtros) => {
      chamadas.listar.push(filtros);

      if (sobrescritas.listar) {
        return sobrescritas.listar(filtros);
      }

      return [dispositivo];
    },
    buscarPorId: async (id) => {
      chamadas.buscarPorId.push(id);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id);
      }

      return dispositivo;
    },
    criar: async (entrada) => {
      chamadas.criar.push(entrada);

      if (sobrescritas.criar) {
        return sobrescritas.criar(entrada);
      }

      return dispositivo;
    },
    atualizar: async (id, entrada) => {
      chamadas.atualizar.push([id, entrada]);

      if (sobrescritas.atualizar) {
        return sobrescritas.atualizar(id, entrada);
      }

      return dispositivo;
    },
    remover: async (id) => {
      chamadas.remover.push(id);

      if (sobrescritas.remover) {
        return sobrescritas.remover(id);
      }
    },
    listarCompartimentos: async (dispositivoId) => {
      chamadas.listarCompartimentos.push(dispositivoId);

      if (sobrescritas.listarCompartimentos) {
        return sobrescritas.listarCompartimentos(dispositivoId);
      }

      return [compartimento];
    },
    criarCompartimento: async (dispositivoId, entrada) => {
      chamadas.criarCompartimento.push([dispositivoId, entrada]);

      if (sobrescritas.criarCompartimento) {
        return sobrescritas.criarCompartimento(dispositivoId, entrada);
      }

      return compartimento;
    },
    atualizarCompartimento: async (dispositivoId, compartimentoId, entrada) => {
      chamadas.atualizarCompartimento.push([
        dispositivoId,
        compartimentoId,
        entrada
      ]);

      if (sobrescritas.atualizarCompartimento) {
        return sobrescritas.atualizarCompartimento(
          dispositivoId,
          compartimentoId,
          entrada
        );
      }

      return compartimento;
    },
    removerCompartimento: async (dispositivoId, compartimentoId) => {
      chamadas.removerCompartimento.push([dispositivoId, compartimentoId]);

      if (sobrescritas.removerCompartimento) {
        return sobrescritas.removerCompartimento(dispositivoId, compartimentoId);
      }
    },
    liberarCompartimento: async (dispositivoId, compartimentoId, entrada) => {
      chamadas.liberarCompartimento.push([dispositivoId, compartimentoId, entrada]);

      if (sobrescritas.liberarCompartimento) {
        return sobrescritas.liberarCompartimento(
          dispositivoId,
          compartimentoId,
          entrada
        );
      }

      return comando;
    },
    travarCompartimento: async (dispositivoId, compartimentoId, entrada) => {
      chamadas.travarCompartimento.push([dispositivoId, compartimentoId, entrada]);

      if (sobrescritas.travarCompartimento) {
        return sobrescritas.travarCompartimento(
          dispositivoId,
          compartimentoId,
          entrada
        );
      }

      return criarComandoTeste({ tipo: 'travar_gaveta' });
    },
    listarComandosPendentes: async (identificador) => {
      chamadas.listarComandosPendentes.push(identificador);

      if (sobrescritas.listarComandosPendentes) {
        return sobrescritas.listarComandosPendentes(identificador);
      }

      return [comando];
    },
    registrarEventoDispositivo: async (identificador, entrada) => {
      chamadas.registrarEventoDispositivo.push([identificador, entrada]);

      if (sobrescritas.registrarEventoDispositivo) {
        return sobrescritas.registrarEventoDispositivo(identificador, entrada);
      }

      return evento;
    },
    obterStatus: async (id) => {
      chamadas.obterStatus.push(id);

      if (sobrescritas.obterStatus) {
        return sobrescritas.obterStatus(id);
      }

      return {
        dispositivoId: id,
        identificador: 'pillgator-01',
        online: true,
        ultimoSinalEm: dataFixa
      };
    }
  };

  return { servico, chamadas };
}

describe('Rotas de dispositivos', () => {
  it('deve listar dispositivos com filtro opcional de paciente', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });

    const response = await request(app).get('/dispositivos?pacienteId=paciente-1');

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([{ pacienteId: 'paciente-1' }]);
    expect(response.body[0]).toMatchObject({
      id: 'dispositivo-1',
      pacienteId: 'paciente-1'
    });
  });

  it('deve criar dispositivo', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = {
      pacienteId: 'paciente-1',
      nome: 'PillGator Quarto',
      identificador: 'pillgator-01'
    };

    const response = await request(app).post('/dispositivos').send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([entrada]);
  });

  it('deve atualizar dispositivo', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = { nome: 'PillGator Sala' };

    const response = await request(app)
      .put('/dispositivos/dispositivo-1')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.atualizar).toEqual([['dispositivo-1', entrada]]);
  });

  it('deve criar compartimento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = {
      numero: 1,
      medicamentoId: 'medicamento-1',
      status: 'bloqueado'
    };

    const response = await request(app)
      .post('/dispositivos/dispositivo-1/compartimentos')
      .send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criarCompartimento).toEqual([
      ['dispositivo-1', entrada]
    ]);
  });

  it('deve atualizar compartimento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = { status: 'liberado' };

    const response = await request(app)
      .put('/dispositivos/dispositivo-1/compartimentos/compartimento-1')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.atualizarCompartimento).toEqual([
      ['dispositivo-1', 'compartimento-1', entrada]
    ]);
  });

  it('deve liberar compartimento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = { motivo: 'Administrar medicamento' };

    const response = await request(app)
      .post('/dispositivos/dispositivo-1/compartimentos/compartimento-1/liberar')
      .send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.liberarCompartimento).toEqual([
      ['dispositivo-1', 'compartimento-1', entrada]
    ]);
  });

  it('deve listar comandos pendentes para IoT', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });

    const response = await request(app).get(
      '/iot/dispositivos/pillgator-01/comandos-pendentes'
    );

    expect(response.status).toBe(200);
    expect(chamadas.listarComandosPendentes).toEqual(['pillgator-01']);
    expect(response.body[0]).toMatchObject({ tipo: 'liberar_gaveta' });
  });

  it('deve registrar evento enviado pelo IoT', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = {
      chaveEvento: 'evt-001',
      tipo: 'compartimento_aberto',
      compartimentoNumero: 1
    };

    const response = await request(app)
      .post('/iot/dispositivos/pillgator-01/eventos')
      .send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.registrarEventoDispositivo).toEqual([
      ['pillgator-01', entrada]
    ]);
    expect(response.body).toMatchObject({ origem: 'iot' });
  });

  it('deve obter status do dispositivo', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });

    const response = await request(app).get('/dispositivos/dispositivo-1/status');

    expect(response.status).toBe(200);
    expect(chamadas.obterStatus).toEqual(['dispositivo-1']);
    expect(response.body).toMatchObject({ online: true });
  });

  it('deve remover compartimento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });

    const response = await request(app).delete(
      '/dispositivos/dispositivo-1/compartimentos/compartimento-1'
    );

    expect(response.status).toBe(204);
    expect(chamadas.removerCompartimento).toEqual([
      ['dispositivo-1', 'compartimento-1']
    ]);
  });

  it('deve tratar erro do servico', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Dispositivo nao encontrado');
      }
    });
    const app = criarApp({
      dispositivosServico: servico,
      autenticacaoAtiva: false
    });

    const response = await request(app).get('/dispositivos/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ mensagem: 'Dispositivo nao encontrado' });
  });
});
