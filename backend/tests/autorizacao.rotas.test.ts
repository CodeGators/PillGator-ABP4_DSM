import request from 'supertest';
import type { Repository } from 'typeorm';

import { criarApp } from '../src/app.js';
import { Usuario } from '../src/entidades/Usuario.js';
import { AutenticacaoServico } from '../src/modulos/autenticacao/autenticacaoServico.js';
import type { UsuariosServicoContrato } from '../src/modulos/usuarios/usuariosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarUsuario(tipo: Usuario['tipo']): Usuario {
  return Object.assign(new Usuario(), {
    id: `usuario-${tipo}`,
    nome: `Usuario ${tipo}`,
    email: `${tipo}@example.com`,
    telefone: null,
    senhaHash: 'hash',
    tipo,
    recebeNotificacoes: false,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa
  });
}

function criarAutenticacaoServico(): AutenticacaoServico {
  return new AutenticacaoServico({} as Repository<Usuario>);
}

function criarUsuariosServicoMock(usuario: Usuario): UsuariosServicoContrato {
  return {
    listar: async () => [usuario],
    buscarPorId: async () => usuario,
    criar: async () => usuario,
    atualizar: async () => usuario,
    remover: async () => undefined
  };
}

describe('Autorizacao das rotas privadas', () => {
  it('deve permitir cadastro publico de usuario sem token', async () => {
    const usuario = criarUsuario('responsavel');
    const app = criarApp({
      usuariosServico: criarUsuariosServicoMock(usuario)
    });

    const response = await request(app).post('/usuarios').send({
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
      tipo: 'responsavel'
    });

    expect(response.status).toBe(201);
  });

  it('deve bloquear cadastro publico de administrador sem token', async () => {
    const usuario = criarUsuario('administrador');
    const app = criarApp({
      usuariosServico: criarUsuariosServicoMock(usuario)
    });

    const response = await request(app).post('/usuarios').send({
      nome: 'Admin',
      cpf: '529.982.247-25',
      email: 'admin@example.com',
      telefone: '11999999999',
      dataNascimento: '1988-02-10',
      enderecoRua: 'Rua Central',
      enderecoEstado: 'SP',
      enderecoCidade: 'Jacarei',
      enderecoCep: '12345-678',
      senha: 'senha-segura',
      confirmarSenha: 'senha-segura',
      tipo: 'administrador'
    });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      mensagem: 'Cadastro publico nao pode criar usuario administrador'
    });
  });

  it('deve bloquear cadastro de paciente em usuarios', async () => {
    const usuario = criarUsuario('responsavel');
    const app = criarApp({
      usuariosServico: criarUsuariosServicoMock(usuario)
    });

    const response = await request(app).post('/usuarios').send({
      nome: 'Joao Paciente',
      cpf: '111.444.777-35',
      email: 'joao@example.com',
      telefone: '11999999999',
      dataNascimento: '2010-01-01',
      enderecoRua: 'Rua Central',
      enderecoEstado: 'SP',
      enderecoCidade: 'Jacarei',
      enderecoCep: '12345-678',
      senha: 'senha-segura',
      confirmarSenha: 'senha-segura',
      tipo: 'paciente'
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      mensagem: 'Cadastro publico aceita apenas usuario responsavel'
    });
  });

  it('deve bloquear rota privada sem token', async () => {
    const app = criarApp();

    const response = await request(app).get('/medicamentos');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      mensagem: 'Token de autenticacao nao informado'
    });
  });

  it('deve permitir administrador acessar rota de usuarios', async () => {
    const usuario = criarUsuario('administrador');
    const autenticacaoServico = criarAutenticacaoServico();
    const app = criarApp({
      autenticacaoServico,
      usuariosServico: criarUsuariosServicoMock(usuario)
    });
    const token = autenticacaoServico.gerarToken(usuario).token;

    const response = await request(app)
      .get('/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });

  it('deve permitir administrador criar outro administrador com token', async () => {
    const usuario = criarUsuario('administrador');
    const autenticacaoServico = criarAutenticacaoServico();
    const app = criarApp({
      autenticacaoServico,
      usuariosServico: criarUsuariosServicoMock(usuario)
    });
    const token = autenticacaoServico.gerarToken(usuario).token;

    const response = await request(app)
      .post('/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Novo Admin',
        cpf: '529.982.247-25',
        email: 'novo.admin@example.com',
        telefone: '11999999999',
        dataNascimento: '1988-02-10',
        enderecoRua: 'Rua Central',
        enderecoEstado: 'SP',
        enderecoCidade: 'Jacarei',
        enderecoCep: '12345-678',
        senha: 'senha-segura',
        confirmarSenha: 'senha-segura',
        tipo: 'administrador'
      });

    expect(response.status).toBe(201);
  });

  it('deve negar responsavel em rota administrativa', async () => {
    const usuario = criarUsuario('responsavel');
    const autenticacaoServico = criarAutenticacaoServico();
    const app = criarApp({ autenticacaoServico });
    const token = autenticacaoServico.gerarToken(usuario).token;

    const response = await request(app)
      .get('/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      mensagem: 'Usuario sem permissao para acessar esta rota'
    });
  });
});
