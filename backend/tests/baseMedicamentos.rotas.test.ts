import request from 'supertest';

import { criarApp } from '../src/app.js';
import { BaseMedicamento } from '../src/entidades/BaseMedicamento.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import type { BaseMedicamentosServicoContrato } from '../src/modulos/baseMedicamentos/baseMedicamentosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarBaseMedicamentoTeste(
  sobrescritas: Partial<BaseMedicamento> = {}
): BaseMedicamento {
  return Object.assign(new BaseMedicamento(), {
    id: 'base-1',
    nomeProduto: 'AAS',
    categoriaProduto: 'ANALGESICOS',
    principioAtivo: 'ACIDO ACETILSALICILICO',
    concentracao: '100,000',
    destinacao: null,
    formaFisica: 'COMPRIMIDO SIMPLES',
    restricaoPrescricao: null,
    restritoHospitalar: false,
    restricaoUso: 'Adulto',
    fonte: 'TA_RESTRICAO_MEDICAMENTO',
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServicoMock(
  sobrescritas: Partial<BaseMedicamentosServicoContrato> = {}
) {
  const medicamento = criarBaseMedicamentoTeste();
  const chamadas = {
    listar: [] as unknown[],
    buscarPorId: [] as string[]
  };

  const servico: BaseMedicamentosServicoContrato = {
    listar: async (filtros) => {
      chamadas.listar.push(filtros);

      if (sobrescritas.listar) {
        return sobrescritas.listar(filtros);
      }

      return [medicamento];
    },
    buscarPorId: async (id) => {
      chamadas.buscarPorId.push(id);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id);
      }

      return medicamento;
    },
    importarCsv: async () => ({ totalLido: 0, totalImportado: 0 })
  };

  return { chamadas, servico };
}

describe('Rotas de base de medicamentos', () => {
  it('deve listar medicamentos da base com filtro opcional', async () => {
    const { chamadas, servico } = criarServicoMock();
    const app = criarApp({
      autenticacaoAtiva: false,
      baseMedicamentosServico: servico
    });

    const response = await request(app).get('/base-medicamentos?busca=aas');

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([{ busca: 'aas' }]);
    expect(response.body[0]).toMatchObject({
      id: 'base-1',
      nomeProduto: 'AAS'
    });
  });

  it('deve buscar medicamento da base por id', async () => {
    const { chamadas, servico } = criarServicoMock();
    const app = criarApp({
      autenticacaoAtiva: false,
      baseMedicamentosServico: servico
    });

    const response = await request(app).get('/base-medicamentos/base-1');

    expect(response.status).toBe(200);
    expect(chamadas.buscarPorId).toEqual(['base-1']);
  });

  it('deve tratar medicamento da base inexistente', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Medicamento da base nao encontrado');
      }
    });
    const app = criarApp({
      autenticacaoAtiva: false,
      baseMedicamentosServico: servico
    });

    const response = await request(app).get('/base-medicamentos/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      mensagem: 'Medicamento da base nao encontrado'
    });
  });
});
