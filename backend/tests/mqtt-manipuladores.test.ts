import { jest } from '@jest/globals';

import { AppDataSource } from '../src/config/data-source.js';
import { Compartimento } from '../src/entidades/Compartimento.js';
import { Dispositivo } from '../src/entidades/Dispositivo.js';
import { EventoMedicamento } from '../src/entidades/EventoMedicamento.js';
import { processarMensagem } from '../src/modulos/mqtt/mqttManipuladores.js';

describe('manipuladores MQTT', () => {
  const dispositivo: Dispositivo = Object.assign(new Dispositivo(), {
    id: 'dispositivo-1',
    identificador: 'PILL-001',
    ativo: true,
    ultimoSinalEm: null
  });
  const compartimento: Compartimento = Object.assign(new Compartimento(), {
    id: 'compartimento-1',
    dispositivoId: 'dispositivo-1',
    numero: 1,
    medicamentoId: 'medicamento-1',
    status: 'bloqueado',
    ativo: true
  });
  const eventos: EventoMedicamento[] = [];

  beforeEach(() => {
    dispositivo.ultimoSinalEm = null;
    compartimento.status = 'bloqueado';
    eventos.length = 0;

    jest.spyOn(AppDataSource, 'getRepository').mockImplementation((entidade) => {
      if (entidade === Dispositivo) {
        return {
          findOne: jest.fn(async ({ where }) => {
            if (
              where.identificador === dispositivo.identificador &&
              where.ativo === dispositivo.ativo
            ) {
              return dispositivo;
            }

            return null;
          }),
          save: jest.fn(async (item) => item)
        } as never;
      }

      if (entidade === Compartimento) {
        return {
          findOne: jest.fn(async ({ where }) => {
            if (
              where.dispositivoId === compartimento.dispositivoId &&
              where.numero === compartimento.numero &&
              where.ativo === compartimento.ativo
            ) {
              return compartimento;
            }

            return null;
          }),
          save: jest.fn(async (item) => item)
        } as never;
      }

      return {
        findOne: jest.fn(async ({ where }) =>
          eventos.find(
            (evento) =>
              evento.dispositivoId === where.dispositivoId &&
              evento.descricao === where.descricao
          ) ?? null
        ),
        create: jest.fn((dados) =>
          Object.assign(new EventoMedicamento(), dados)
        ),
        save: jest.fn(async (evento) => {
          eventos.push(evento as EventoMedicamento);
          return evento;
        })
      } as never;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve atualizar ultimo sinal e status da gaveta pelo heartbeat', async () => {
    await processarMensagem(
      'pillgator/PILL-001/status/heartbeat',
      Buffer.from(
        JSON.stringify({
          dispositivoId: 'PILL-001',
          timestamp: '2026-06-02T12:00:00.000Z',
          gavetas: [{ numero: 1, status: 'aberto' }]
        })
      )
    );

    const ultimoSinalEm = dispositivo.ultimoSinalEm;

    expect(ultimoSinalEm).toBeInstanceOf(Date);
    expect(ultimoSinalEm?.toISOString()).toBe(
      '2026-06-02T12:00:00.000Z'
    );
    expect(compartimento.status).toBe('aberto');
  });

  it('deve salvar evento MQTT e atualizar status da gaveta', async () => {
    compartimento.status = 'liberado';

    await processarMensagem(
      'pillgator/PILL-001/evento/gaveta_aberta',
      Buffer.from(
        JSON.stringify({
          dispositivoId: 'PILL-001',
          compartimento: 1,
          tipo: 'gaveta_aberta',
          timestamp: '2026-06-02T12:01:00.000Z',
          msgId: 'msg-teste-1'
        })
      )
    );

    expect(compartimento.status).toBe('aberto');
    expect(eventos).toHaveLength(1);
    const evento = eventos[0];

    expect(evento).toBeDefined();
    expect(evento).toMatchObject({
      medicamentoId: 'medicamento-1',
      dispositivoId: 'PILL-001',
      tipo: 'compartimento_aberto',
      origem: 'iot',
      descricao: 'msg-teste-1'
    });
    expect(evento?.dados).toMatchObject({
      compartimento: 1,
      compartimentoId: 'compartimento-1',
      dispositivoBancoId: 'dispositivo-1'
    });
  });

  it('deve bloquear a gaveta quando medicamento for retirado', async () => {
    compartimento.status = 'aberto';

    await processarMensagem(
      'pillgator/PILL-001/evento/medicamento_retirado',
      Buffer.from(
        JSON.stringify({
          dispositivoId: 'PILL-001',
          compartimento: 1,
          timestamp: '2026-06-02T12:02:00.000Z',
          msgId: 'msg-teste-2'
        })
      )
    );

    expect(compartimento.status).toBe('bloqueado');
    expect(eventos[0]?.tipo).toBe('medicamento_retirado');
  });
});
