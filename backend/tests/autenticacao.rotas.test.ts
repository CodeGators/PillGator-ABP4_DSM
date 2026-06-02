import request from 'supertest';
import type { Repository } from 'typeorm';

import { criarApp } from '../src/app.js';
import { Usuario } from '../src/entidades/Usuario.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { AutenticacaoServico } from '../src/modulos/autenticacao/autenticacaoServico.js';
import type { AutenticacaoServicoContrato } from '../src/modulos/autenticacao/autenticacaoTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarUsuario(): Usuario {
  return Object.assign(new Usuario(), {
    id: 'usuario-1',
    nome: 'Admin',
    email: 'admin@example.com',
    telefone: null,
    senhaHash: 'hash',
    tipo: 'administrador',
    recebeNotificacoes: false,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa
  });
}

function criarServicoMock(
  sobrescritas: Partial<AutenticacaoServicoContrato> = {}
) {
  const usuario = criarUsuario();
  const chamadas = {
    login: [] as unknown[],
    solicitarRecuperacaoSenha: [] as unknown[],
    redefinirSenha: [] as unknown[],
    buscarUsuarioAutenticado: [] as string[]
  };

  const servico: AutenticacaoServicoContrato = {
    login: async (entrada) => {
      chamadas.login.push(entrada);

      if (sobrescritas.login) {
        return sobrescritas.login(entrada);
      }

      return {
        token: 'token-jwt',
        tipoToken: 'Bearer',
        expiraEm: '8h',
        usuario
      };
    },
    solicitarRecuperacaoSenha: async (entrada) => {
      chamadas.solicitarRecuperacaoSenha.push(entrada);

      if (sobrescritas.solicitarRecuperacaoSenha) {
        return sobrescritas.solicitarRecuperacaoSenha(entrada);
      }

      return {
        identificador: 'admin@example.com',
        mensagem: 'Cadastro encontrado. Informe uma nova senha.'
      };
    },
    redefinirSenha: async (entrada) => {
      chamadas.redefinirSenha.push(entrada);

      if (sobrescritas.redefinirSenha) {
        return sobrescritas.redefinirSenha(entrada);
      }

      return { mensagem: 'Senha redefinida com sucesso.' };
    },
    gerarToken: (usuarioParaToken) => {
      if (sobrescritas.gerarToken) {
        return sobrescritas.gerarToken(usuarioParaToken);
      }

      return {
        token: 'token-jwt',
        tipoToken: 'Bearer',
        expiraEm: '8h',
        usuario: usuarioParaToken
      };
    },
    buscarUsuarioAutenticado: async (id) => {
      chamadas.buscarUsuarioAutenticado.push(id);

      if (sobrescritas.buscarUsuarioAutenticado) {
        return sobrescritas.buscarUsuarioAutenticado(id);
      }

      return usuario;
    }
  };

  return { servico, chamadas };
}

describe('Rotas de autenticacao', () => {
  it('deve realizar login', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ autenticacaoServico: servico });
    const entrada = {
      email: 'admin@example.com',
      senha: 'senha-segura'
    };

    const response = await request(app).post('/auth/login').send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.login).toEqual([entrada]);
    expect(response.body).toMatchObject({
      token: 'token-jwt',
      tipoToken: 'Bearer',
      usuario: {
        id: 'usuario-1',
        tipo: 'administrador'
      }
    });
    expect(response.body.usuario).not.toHaveProperty('senhaHash');
  });

  it('deve tratar erro de credenciais invalidas', async () => {
    const { servico } = criarServicoMock({
      login: async () => {
        throw new ErroHttp(401, 'Email ou senha invalidos');
      }
    });
    const app = criarApp({ autenticacaoServico: servico });

    const response = await request(app).post('/auth/login').send({
      email: 'admin@example.com',
      senha: 'senha-errada'
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ mensagem: 'Email ou senha invalidos' });
  });

  it('deve localizar conta para recuperacao de senha', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ autenticacaoServico: servico });
    const entrada = { identificador: 'admin@example.com' };

    const response = await request(app)
      .post('/auth/recuperar-senha')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.solicitarRecuperacaoSenha).toEqual([entrada]);
    expect(response.body).toEqual({
      identificador: 'admin@example.com',
      mensagem: 'Cadastro encontrado. Informe uma nova senha.'
    });
  });

  it('deve redefinir senha com identificador localizado', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ autenticacaoServico: servico });
    const entrada = {
      identificador: 'admin@example.com',
      senha: 'nova-senha',
      confirmarSenha: 'nova-senha'
    };

    const response = await request(app)
      .post('/auth/redefinir-senha')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.redefinirSenha).toEqual([entrada]);
    expect(response.body).toEqual({ mensagem: 'Senha redefinida com sucesso.' });
  });

  it('deve retornar usuario autenticado', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ autenticacaoServico: servico });
    const token = new AutenticacaoServico({} as Repository<Usuario>)
      .gerarToken(criarUsuario())
      .token;

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(chamadas.buscarUsuarioAutenticado).toEqual(['usuario-1']);
    expect(response.body).toMatchObject({
      id: 'usuario-1',
      tipo: 'administrador'
    });
  });
});
