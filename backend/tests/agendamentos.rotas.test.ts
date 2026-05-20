import request from 'supertest';

import { criarApp } from '../src/app.js';
import type { AgendamentoMedicamento } from '../src/entidades/AgendamentoMedicamento.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import type { AgendamentosServicoContrato } from '../src/modulos/agendamentos/agendamentosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarAgendamentoTeste(
  sobrescritas: Partial<AgendamentoMedicamento> = {}
): AgendamentoMedicamento {
  return {
    id: 'agendamento-1',
    medicamentoId: 'medicamento-1',
    tipo: 'horarios_fixos',
    diasSemana: [1, 2, 3, 4, 5],
    horarios: ['08:00'],
    intervaloHoras: null,
    horarioInicio: null,
    inicioEm: '2026-05-01',
    fimEm: null,
    toleranciaMinutos: 30,
    cuidados: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    medicamento: null as never,
    ...sobrescritas
  };
}

function criarServicoMock(sobrescritas: Partial<AgendamentosServicoContrato> = {}) {
  const agendamento = criarAgendamentoTeste();
  const chamadas = {
    listar: [] as unknown[],
    listarProximasAdministracoes: [] as unknown[],
    buscarPorId: [] as Array<[string, unknown]>,
    criar: [] as Array<[unknown, unknown]>,
    atualizar: [] as Array<[string, unknown, unknown]>,
    remover: [] as Array<[string, unknown]>
  };

  const servico: AgendamentosServicoContrato = {
    listar: async (filtros, contexto) => {
      chamadas.listar.push({ filtros, contexto });

      if (sobrescritas.listar) {
        return sobrescritas.listar(filtros, contexto);
      }

      return [agendamento];
    },
    listarProximasAdministracoes: async (filtros, contexto) => {
      chamadas.listarProximasAdministracoes.push({ filtros, contexto });

      if (sobrescritas.listarProximasAdministracoes) {
        return sobrescritas.listarProximasAdministracoes(filtros, contexto);
      }

      return [
        {
          agendamentoId: 'agendamento-1',
          medicamentoId: 'medicamento-1',
          pacienteId: 'paciente-1',
          medicamentoNome: 'Losartana',
          horarioPrevisto: '2026-05-01T08:00:00',
          tipo: 'horarios_fixos',
          cuidados: null
        }
      ];
    },
    buscarPorId: async (id, contexto) => {
      chamadas.buscarPorId.push([id, contexto]);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id, contexto);
      }

      return agendamento;
    },
    criar: async (entrada, contexto) => {
      chamadas.criar.push([entrada, contexto]);

      if (sobrescritas.criar) {
        return sobrescritas.criar(entrada, contexto);
      }

      return agendamento;
    },
    atualizar: async (id, entrada, contexto) => {
      chamadas.atualizar.push([id, entrada, contexto]);

      if (sobrescritas.atualizar) {
        return sobrescritas.atualizar(id, entrada, contexto);
      }

      return agendamento;
    },
    remover: async (id, contexto) => {
      chamadas.remover.push([id, contexto]);

      if (sobrescritas.remover) {
        return sobrescritas.remover(id, contexto);
      }
    }
  };

  return { servico, chamadas };
}

describe('Rotas de agendamentos', () => {
  it('deve listar agendamentos com filtro opcional de medicamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get(
      '/agendamentos?medicamentoId=medicamento-1&pacienteId=paciente-1'
    );

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([
      {
        filtros: { medicamentoId: 'medicamento-1', pacienteId: 'paciente-1' },
        contexto: undefined
      }
    ]);
    expect(response.body[0]).toMatchObject({
      id: 'agendamento-1',
      medicamentoId: 'medicamento-1',
      tipo: 'horarios_fixos'
    });
  });

  it('deve listar proximas administracoes', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get(
      '/agendamentos/proximas-administracoes?pacienteId=paciente-1&data=2026-05-01'
    );

    expect(response.status).toBe(200);
    expect(chamadas.listarProximasAdministracoes).toEqual([
      {
        filtros: { pacienteId: 'paciente-1', data: '2026-05-01' },
        contexto: undefined
      }
    ]);
    expect(response.body[0]).toMatchObject({
      agendamentoId: 'agendamento-1',
      horarioPrevisto: '2026-05-01T08:00:00'
    });
  });

  it('deve criar agendamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });
    const entrada = {
      medicamentoId: 'medicamento-1',
      tipo: 'intervalo',
      diasSemana: [0, 1, 2, 3, 4, 5, 6],
      intervaloHoras: 8,
      horarioInicio: '06:00'
    };

    const response = await request(app).post('/agendamentos').send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([[entrada, undefined]]);
  });

  it('deve atualizar agendamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });
    const entrada = { horarios: ['08:00', '20:00'] };

    const response = await request(app)
      .put('/agendamentos/agendamento-1')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.atualizar).toEqual([
      ['agendamento-1', entrada, undefined]
    ]);
  });

  it('deve remover agendamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).delete('/agendamentos/agendamento-1');

    expect(response.status).toBe(204);
    expect(chamadas.remover).toEqual([['agendamento-1', undefined]]);
  });

  it('deve tratar erro do servico', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Agendamento nao encontrado');
      }
    });
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/agendamentos/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ mensagem: 'Agendamento nao encontrado' });
  });
});
