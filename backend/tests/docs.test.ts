import request from 'supertest';

import app from '../src/app.js';

describe('Documentacao da API', () => {
  it('deve expor o documento OpenAPI em portugues', async () => {
    const response = await request(app).get('/docs.json');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      openapi: '3.0.3',
      info: {
        title: 'PillGator API'
      }
    });
    expect(response.body.paths).toHaveProperty('/usuarios');
    expect(response.body.paths).toHaveProperty('/pacientes');
    expect(response.body.paths).toHaveProperty('/pacientes/meus');
    expect(response.body.paths).toHaveProperty('/dispositivos');
    expect(response.body.paths).toHaveProperty('/notificacoes');
    expect(response.body.paths).toHaveProperty('/auth/login');
    expect(response.body.paths).toHaveProperty('/base-medicamentos');
    expect(response.body.paths).toHaveProperty('/medicamentos');
    expect(response.body.paths).toHaveProperty('/agendamentos');
    expect(response.body.paths).toHaveProperty('/eventos');
    expect(response.body.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Usuarios' }),
        expect.objectContaining({ name: 'Pacientes' }),
        expect.objectContaining({ name: 'Dispositivos' }),
        expect.objectContaining({ name: 'Notificacoes' }),
        expect.objectContaining({ name: 'Autenticacao' }),
        expect.objectContaining({ name: 'Base de Medicamentos' }),
        expect.objectContaining({ name: 'Medicamentos' }),
        expect.objectContaining({ name: 'Agendamentos' }),
        expect.objectContaining({ name: 'Eventos' })
      ])
    );
  });

  it('deve expor a interface do Swagger UI', async () => {
    const response = await request(app).get('/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('PillGator API - Documentacao');
    expect(response.text).toContain('swagger-ui');
  });
});
