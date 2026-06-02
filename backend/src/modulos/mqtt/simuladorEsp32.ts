export type StatusGavetaSimulada = 'bloqueado' | 'liberado' | 'aberto' | 'erro';

export type TipoEventoSimulado =
  | 'alerta_emitido'
  | 'gaveta_aberta'
  | 'medicamento_retirado'
  | 'dose_perdida'
  | 'erro';

export type GavetaSimulada = {
  numero: number;
  status: StatusGavetaSimulada;
};

export type ComandoManualSimulador =
  | { tipo: 'abrir' | 'retirar' | 'perdida' | 'erro'; compartimento: number }
  | { tipo: 'status' | 'ajuda' | 'sair' };

export function criarGavetasSimuladas(quantidade: number): GavetaSimulada[] {
  const total = Number.isInteger(quantidade) && quantidade > 0 ? quantidade : 3;

  return Array.from({ length: total }, (_valor, indice) => ({
    numero: indice + 1,
    status: 'bloqueado' as const,
  }));
}

export function criarMsgId(dispositivoId: string, sequencia: number): string {
  return `${dispositivoId}-${Date.now()}-${sequencia}`;
}

export function criarPayloadHeartbeat(
  dispositivoId: string,
  gavetas: GavetaSimulada[],
  iniciadoEm: number,
  agora: Date = new Date()
) {
  return {
    dispositivoId,
    uptimeSegundos: Math.floor((Date.now() - iniciadoEm) / 1000),
    gavetas: gavetas.map((gaveta) => ({
      numero: gaveta.numero,
      status: gaveta.status,
    })),
    timestamp: agora.toISOString(),
  };
}

export function criarPayloadEvento(
  dispositivoId: string,
  tipo: TipoEventoSimulado,
  compartimento: number,
  msgId: string,
  dados: Record<string, unknown> = {},
  agora: Date = new Date()
) {
  return {
    dispositivoId,
    compartimento,
    tipo,
    timestamp: agora.toISOString(),
    msgId,
    dados,
  };
}

export function obterCompartimentoDoPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const { compartimento } = payload as { compartimento?: unknown };

  if (typeof compartimento !== 'number' || !Number.isInteger(compartimento)) {
    return null;
  }

  return compartimento;
}

export function interpretarComandoManual(
  linha: string
): ComandoManualSimulador | null {
  const partes = linha.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const acao = partes[0];

  if (!acao) {
    return null;
  }

  if (acao === 'status' || acao === 'ajuda' || acao === 'sair') {
    return { tipo: acao };
  }

  if (
    acao !== 'abrir' &&
    acao !== 'retirar' &&
    acao !== 'perdida' &&
    acao !== 'erro'
  ) {
    return null;
  }

  const compartimento = Number(partes[1]);

  if (!Number.isInteger(compartimento) || compartimento < 1) {
    return null;
  }

  return { tipo: acao, compartimento };
}

