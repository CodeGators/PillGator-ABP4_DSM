import request from 'supertest';

import { criarApp } from '../src/app.js';
import type { Notificacao } from '../src/entidades/Notificacao.js';
import type { TokenPush } from '../src/entidades/TokenPush.js';
import type { NotificacoesServicoContrato } from '../src/modulos/notificacoes/notificacoesTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarNotificacaoTeste(
  sobrescritas: Partial<Notificacao> = {}
): Notificacao {
  return {
    id: 'notificacao-1',
    pacienteId: 'paciente-1',
    paciente: null as never,
    responsavelId: 'responsavel-1',
    responsavel: null as never,
    medicamentoId: 'medicamento-1',
    medicamento: null,
    agendamentoId: 'agendamento-1',
    agendamento: null,
    eventoId: 'evento-1',
    evento: null,
    tipo: 'atraso_medicamento',
    canal: 'interno',
    status: 'enviada',
    titulo: 'Medicamento em atraso',
    mensagem: 'Medicamento em atraso.',
    enviadaEm: dataFixa,
    lidaEm: null,
    dados: null,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarServicoMock(
  sobrescritas: Partial<NotificacoesServicoContrato> = {}
) {
  const notificacao = criarNotificacaoTeste();
  const chamadas = {
    listar: [] as unknown[],
    registrarTokenPush: [] as unknown[],
    processarProximasNotificacoes: [] as unknown[],
    verificarAtrasos: [] as unknown[]
  };

  const servico: NotificacoesServicoContrato = {
    listar: async (filtros) => {
      chamadas.listar.push(filtros);

      if (sobrescritas.listar) {
        return sobrescritas.listar(filtros);
      }

      return [notificacao];
    },
    registrarTokenPush: async (entrada, contexto) => {
      chamadas.registrarTokenPush.push({ entrada, contexto });

      if (sobrescritas.registrarTokenPush) {
        return sobrescritas.registrarTokenPush(entrada, contexto);
      }

      return {
        id: 'token-1',
        responsavelId: 'responsavel-1',
        responsavel: null as never,
        token: 'ExpoPushToken[aaaaaaaaaaaaaaaaaaaaaa]',
        plataforma: 'android',
        dispositivoNome: 'Celular teste',
        ativo: true,
        ultimoRegistroEm: dataFixa,
        criadoEm: dataFixa,
        atualizadoEm: dataFixa
      } as TokenPush;
    },
    processarProximasNotificacoes: async (entrada) => {
      chamadas.processarProximasNotificacoes.push(entrada);

      if (sobrescritas.processarProximasNotificacoes) {
        return sobrescritas.processarProximasNotificacoes(entrada);
      }

      return {
        referenciaEm: '2026-05-11T07:50:00.000Z',
        notificacoesCriadas: 1,
        notificacoesEnviadas: 1,
        notificacoesComErro: 0
      };
    },
    verificarAtrasos: async (entrada) => {
      chamadas.verificarAtrasos.push(entrada);

      if (sobrescritas.verificarAtrasos) {
        return sobrescritas.verificarAtrasos(entrada);
      }

      return {
        referenciaEm: '2026-05-11T09:00:00.000Z',
        atrasosDetectados: 1,
        eventosCriados: 1,
        notificacoesCriadas: 1
      };
    }
  };

  return { servico, chamadas };
}

describe('Rotas de notificacoes', () => {
  it('deve listar notificacoes com filtros opcionais', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      notificacoesServico: servico,
      autenticacaoAtiva: false
    });

    const response = await request(app).get(
      '/notificacoes?pacienteId=paciente-1&status=enviada'
    );

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([
      { pacienteId: 'paciente-1', status: 'enviada' }
    ]);
    expect(response.body[0]).toMatchObject({
      id: 'notificacao-1',
      tipo: 'atraso_medicamento'
    });
  });

  it('deve registrar token push', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      notificacoesServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = {
      responsavelId: 'responsavel-1',
      token: 'ExpoPushToken[aaaaaaaaaaaaaaaaaaaaaa]',
      plataforma: 'android',
      dispositivoNome: 'Celular teste'
    };

    const response = await request(app)
      .post('/notificacoes/tokens-push')
      .send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.registrarTokenPush).toEqual([
      { entrada, contexto: undefined }
    ]);
    expect(response.body).toMatchObject({
      responsavelId: 'responsavel-1',
      token: 'ExpoPushToken[aaaaaaaaaaaaaaaaaaaaaa]'
    });
  });

  it('deve processar proximas notificacoes', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      notificacoesServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = {
      referenciaEm: '2026-05-11T07:50:00.000Z',
      antecedenciaMinutos: 15,
      janelaMinutos: 5
    };

    const response = await request(app)
      .post('/notificacoes/processar-proximas')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.processarProximasNotificacoes).toEqual([entrada]);
    expect(response.body).toMatchObject({
      notificacoesCriadas: 1,
      notificacoesEnviadas: 1
    });
  });

  it('deve verificar atrasos', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      notificacoesServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = {
      referenciaEm: '2026-05-11T09:00:00.000Z'
    };

    const response = await request(app)
      .post('/notificacoes/verificar-atrasos')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.verificarAtrasos).toEqual([entrada]);
    expect(response.body).toMatchObject({
      atrasosDetectados: 1,
      eventosCriados: 1,
      notificacoesCriadas: 1
    });
  });
});
