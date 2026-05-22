import request from 'supertest';

import { criarApp } from '../src/app.js';
import { Medicamento } from '../src/entidades/Medicamento.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import type { MedicamentosServicoContrato } from '../src/modulos/medicamentos/medicamentosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarMedicamentoTeste(
  sobrescritas: Partial<Medicamento> = {}
): Medicamento {
  return Object.assign(new Medicamento(), {
    id: 'medicamento-1',
    pacienteId: 'paciente-1',
    baseMedicamentoId: 'base-1',
    nome: 'Dipirona',
    dosagem: '500mg',
    quantidadeAdministrada: '1',
    unidadeAdministracao: 'comprimido',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServicoMock(
  sobrescritas: Partial<MedicamentosServicoContrato> = {}
): {
  servico: MedicamentosServicoContrato;
  chamadas: {
    listar: unknown[];
    buscarPorId: Array<[string, unknown]>;
    criar: Array<[unknown, unknown]>;
    atualizar: Array<[string, unknown, unknown]>;
    remover: Array<[string, unknown]>;
  };
} {
  const medicamento = criarMedicamentoTeste();
  const chamadas = {
    listar: [] as unknown[],
    buscarPorId: [] as Array<[string, unknown]>,
    criar: [] as Array<[unknown, unknown]>,
    atualizar: [] as Array<[string, unknown, unknown]>,
    remover: [] as Array<[string, unknown]>
  };

  const servico: MedicamentosServicoContrato = {
    listar: async (filtros, contexto) => {
      chamadas.listar.push({ filtros, contexto });

      if (sobrescritas.listar) {
        return sobrescritas.listar(filtros, contexto);
      }

      return [medicamento];
    },
    buscarPorId: async (id, contexto) => {
      chamadas.buscarPorId.push([id, contexto]);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id, contexto);
      }

      return medicamento;
    },
    criar: async (entrada, contexto) => {
      chamadas.criar.push([entrada, contexto]);

      if (sobrescritas.criar) {
        return sobrescritas.criar(entrada, contexto);
      }

      return medicamento;
    },
    atualizar: async (id, entrada, contexto) => {
      chamadas.atualizar.push([id, entrada, contexto]);

      if (sobrescritas.atualizar) {
        return sobrescritas.atualizar(id, entrada, contexto);
      }

      return medicamento;
    },
    remover: async (id, contexto) => {
      chamadas.remover.push([id, contexto]);

      if (sobrescritas.remover) {
        return sobrescritas.remover(id, contexto);
      }
    },
    ...sobrescritas
  };

  return { servico, chamadas };
}

describe('Rotas de medicamentos', () => {
  it('deve listar medicamentos', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/medicamentos?pacienteId=paciente-1');

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([
      { filtros: { pacienteId: 'paciente-1' }, contexto: undefined }
    ]);
    expect(response.body).toEqual([
      {
        id: 'medicamento-1',
        pacienteId: 'paciente-1',
        baseMedicamentoId: 'base-1',
        nome: 'Dipirona',
        dosagem: '500mg',
        quantidadeAdministrada: '1',
        unidadeAdministracao: 'comprimido',
        observacoes: null,
        ativo: true,
        criadoEm: dataFixa.toISOString(),
        atualizadoEm: dataFixa.toISOString()
      }
    ]);
  });

  it('deve buscar medicamento por id', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/medicamentos/medicamento-1');

    expect(response.status).toBe(200);
    expect(chamadas.buscarPorId).toEqual([['medicamento-1', undefined]]);
    expect(response.body.nome).toBe('Dipirona');
  });

  it('deve criar medicamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico, autenticacaoAtiva: false });
    const entrada = {
      pacienteId: 'paciente-1',
      baseMedicamentoId: 'base-1',
      nome: 'Dipirona',
      dosagem: '500mg',
      quantidadeAdministrada: '1',
      unidadeAdministracao: 'comprimido',
      observacoes: 'Tomar com agua'
    };

    const response = await request(app).post('/medicamentos').send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([[entrada, undefined]]);
    expect(response.body.id).toBe('medicamento-1');
  });

  it('deve atualizar medicamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico, autenticacaoAtiva: false });
    const entrada = {
      nome: 'Dipirona gotas'
    };

    const response = await request(app)
      .put('/medicamentos/medicamento-1')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.atualizar).toEqual([
      ['medicamento-1', entrada, undefined]
    ]);
  });

  it('deve remover medicamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).delete('/medicamentos/medicamento-1');

    expect(response.status).toBe(204);
    expect(chamadas.remover).toEqual([['medicamento-1', undefined]]);
  });

  it('deve retornar erro tratado pelo middleware', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Medicamento nao encontrado');
      }
    });
    const app = criarApp({ medicamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/medicamentos/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ mensagem: 'Medicamento nao encontrado' });
  });
});
