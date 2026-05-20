import request from 'supertest';

import { criarApp } from '../src/app.js';
import { Usuario } from '../src/entidades/Usuario.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import type { UsuariosServicoContrato } from '../src/modulos/usuarios/usuariosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarUsuarioTeste(sobrescritas: Partial<Usuario> = {}): Usuario {
  return Object.assign(new Usuario(), {
    id: 'usuario-1',
    nome: 'Maria Responsavel',
    email: 'maria@example.com',
    telefone: '11999999999',
    senhaHash: null,
    tipo: 'responsavel',
    recebeNotificacoes: true,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServicoMock(sobrescritas: Partial<UsuariosServicoContrato> = {}) {
  const usuario = criarUsuarioTeste();
  const chamadas = {
    listar: [] as unknown[],
    buscarPorId: [] as string[],
    criar: [] as unknown[],
    atualizar: [] as Array<[string, unknown]>,
    remover: [] as string[]
  };

  const servico: UsuariosServicoContrato = {
    listar: async (filtros) => {
      chamadas.listar.push(filtros);

      if (sobrescritas.listar) {
        return sobrescritas.listar(filtros);
      }

      return [usuario];
    },
    buscarPorId: async (id) => {
      chamadas.buscarPorId.push(id);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id);
      }

      return usuario;
    },
    criar: async (entrada) => {
      chamadas.criar.push(entrada);

      if (sobrescritas.criar) {
        return sobrescritas.criar(entrada);
      }

      return usuario;
    },
    atualizar: async (id, entrada) => {
      chamadas.atualizar.push([id, entrada]);

      if (sobrescritas.atualizar) {
        return sobrescritas.atualizar(id, entrada);
      }

      return usuario;
    },
    remover: async (id) => {
      chamadas.remover.push(id);

      if (sobrescritas.remover) {
        return sobrescritas.remover(id);
      }
    }
  };

  return { servico, chamadas };
}

describe('Rotas de usuarios', () => {
  it('deve listar usuarios com filtro opcional de tipo', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ usuariosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/usuarios?tipo=responsavel');

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([{ tipo: 'responsavel' }]);
    expect(response.body[0]).toMatchObject({
      id: 'usuario-1',
      tipo: 'responsavel'
    });
  });

  it('deve criar usuario', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ usuariosServico: servico, autenticacaoAtiva: false });
    const entrada = {
      nome: 'Maria Responsavel',
      cpf: '935.411.347-80',
      email: 'maria@example.com',
      telefone: '11999999999',
      dataNascimento: '1990-05-20',
      enderecoRua: 'Rua das Flores',
      enderecoEstado: 'SP',
      enderecoCidade: 'Jacarei',
      enderecoCep: '12345-678',
      senha: 'senha-segura',
      confirmarSenha: 'senha-segura',
      tipo: 'responsavel',
      recebeNotificacoes: true
    };

    const response = await request(app).post('/usuarios').send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([entrada]);
  });

  it('deve atualizar usuario', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ usuariosServico: servico, autenticacaoAtiva: false });
    const entrada = { telefone: '11888888888' };

    const response = await request(app).put('/usuarios/usuario-1').send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.atualizar).toEqual([['usuario-1', entrada]]);
  });

  it('deve remover usuario', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ usuariosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).delete('/usuarios/usuario-1');

    expect(response.status).toBe(204);
    expect(chamadas.remover).toEqual(['usuario-1']);
  });

  it('deve tratar erro do servico', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Usuario nao encontrado');
      }
    });
    const app = criarApp({ usuariosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/usuarios/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ mensagem: 'Usuario nao encontrado' });
  });
});
