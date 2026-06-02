import {
  criarGavetasSimuladas,
  criarPayloadEvento,
  criarPayloadHeartbeat,
  interpretarComandoManual,
  obterCompartimentoDoPayload
} from '../src/modulos/mqtt/simuladorEsp32.js';

describe('simulador ESP32 MQTT', () => {
  it('deve criar gavetas bloqueadas por padrao', () => {
    expect(criarGavetasSimuladas(2)).toEqual([
      { numero: 1, status: 'bloqueado' },
      { numero: 2, status: 'bloqueado' }
    ]);
  });

  it('deve montar payload de heartbeat', () => {
    const payload = criarPayloadHeartbeat(
      'PILL-001',
      [{ numero: 1, status: 'liberado' }],
      Date.now(),
      new Date('2026-01-01T12:00:00.000Z')
    );

    expect(payload).toMatchObject({
      dispositivoId: 'PILL-001',
      gavetas: [{ numero: 1, status: 'liberado' }],
      timestamp: '2026-01-01T12:00:00.000Z'
    });
    expect(payload.uptimeSegundos).toBeGreaterThanOrEqual(0);
  });

  it('deve montar payload de evento', () => {
    expect(
      criarPayloadEvento(
        'PILL-001',
        'gaveta_aberta',
        1,
        'msg-1',
        { origem: 'teste' },
        new Date('2026-01-01T12:00:00.000Z')
      )
    ).toEqual({
      dispositivoId: 'PILL-001',
      compartimento: 1,
      tipo: 'gaveta_aberta',
      timestamp: '2026-01-01T12:00:00.000Z',
      msgId: 'msg-1',
      dados: { origem: 'teste' }
    });
  });

  it('deve obter compartimento de payload mqtt', () => {
    expect(obterCompartimentoDoPayload({ compartimento: 3 })).toBe(3);
    expect(obterCompartimentoDoPayload({ compartimento: '3' })).toBeNull();
    expect(obterCompartimentoDoPayload(null)).toBeNull();
  });

  it('deve interpretar comandos manuais', () => {
    expect(interpretarComandoManual('abrir 1')).toEqual({
      tipo: 'abrir',
      compartimento: 1
    });
    expect(interpretarComandoManual('status')).toEqual({ tipo: 'status' });
    expect(interpretarComandoManual('sair')).toEqual({ tipo: 'sair' });
    expect(interpretarComandoManual('abrir x')).toBeNull();
    expect(interpretarComandoManual('qualquer')).toBeNull();
  });
});

