import readline from 'node:readline';

import dotenv from 'dotenv';
import mqtt from 'mqtt';

import {
  criarGavetasSimuladas,
  criarMsgId,
  criarPayloadEvento,
  criarPayloadHeartbeat,
  interpretarComandoManual,
  obterCompartimentoDoPayload,
  type GavetaSimulada,
  type TipoEventoSimulado,
} from '../modulos/mqtt/simuladorEsp32.js';

dotenv.config({ quiet: true });

const brokerUrl = process.env.MQTT_BROKER_URL ?? '';
const usuario =
  process.env.MQTT_ESP32_USERNAME ?? process.env.MQTT_USERNAME ?? '';
const senha =
  process.env.MQTT_ESP32_PASSWORD ?? process.env.MQTT_PASSWORD ?? '';
const dispositivoId = process.env.SIMULADOR_DEVICE_ID ?? 'PILL-001';
const quantidadeGavetas = Number(process.env.SIMULADOR_GAVETAS ?? 3);
const intervaloHeartbeat = Number(
  process.env.SIMULADOR_HEARTBEAT_MS ?? 30000
);

if (!brokerUrl) {
  console.error('SIMULADOR: configure MQTT_BROKER_URL no .env do backend.');
  process.exit(1);
}

const gavetas = criarGavetasSimuladas(quantidadeGavetas);
const iniciadoEm = Date.now();
let sequenciaMsg = 0;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const opcoesMqtt: mqtt.IClientOptions = {
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 5000,
};

if (usuario) {
  opcoesMqtt.username = usuario;
}

if (senha) {
  opcoesMqtt.password = senha;
}

const cliente = mqtt.connect(brokerUrl, opcoesMqtt);

function topico(categoria: string, tipo: string): string {
  return `pillgator/${dispositivoId}/${categoria}/${tipo}`;
}

function proximoMsgId(): string {
  sequenciaMsg += 1;
  return criarMsgId(dispositivoId, sequenciaMsg);
}

function publicar(topicoDestino: string, payload: object): void {
  cliente.publish(topicoDestino, JSON.stringify(payload), { qos: 1 }, (erro) => {
    if (erro) {
      console.error(`SIMULADOR: erro ao publicar em ${topicoDestino}`, erro);
      return;
    }

    console.log(`SIMULADOR: publicado ${topicoDestino}`);
  });
}

function publicarHeartbeat(): void {
  publicar(
    topico('status', 'heartbeat'),
    criarPayloadHeartbeat(dispositivoId, gavetas, iniciadoEm)
  );
}

function publicarEvento(
  tipo: TipoEventoSimulado,
  compartimento: number,
  dados: Record<string, unknown> = {}
): void {
  publicar(
    topico('evento', tipo),
    criarPayloadEvento(
      dispositivoId,
      tipo,
      compartimento,
      proximoMsgId(),
      dados
    )
  );
}

function encontrarGaveta(numero: number): GavetaSimulada | null {
  return gavetas.find((gaveta) => gaveta.numero === numero) ?? null;
}

function alterarStatus(numero: number, status: GavetaSimulada['status']): void {
  const gaveta = encontrarGaveta(numero);

  if (!gaveta) {
    console.warn(`SIMULADOR: gaveta ${numero} nao existe.`);
    return;
  }

  gaveta.status = status;
  console.log(`SIMULADOR: gaveta ${numero} -> ${status}`);
  publicarHeartbeat();
}

async function esperar(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function simularLiberacao(compartimento: number): Promise<void> {
  const gaveta = encontrarGaveta(compartimento);

  if (!gaveta) {
    console.warn(`SIMULADOR: comando ignorado, gaveta ${compartimento} nao existe.`);
    return;
  }

  alterarStatus(compartimento, 'liberado');
  publicarEvento('alerta_emitido', compartimento, { origem: 'comando_mqtt' });

  await esperar(1500);
  alterarStatus(compartimento, 'aberto');
  publicarEvento('gaveta_aberta', compartimento, { origem: 'simulador' });

  await esperar(1500);
  publicarEvento('medicamento_retirado', compartimento, { origem: 'simulador' });
  alterarStatus(compartimento, 'bloqueado');
}

function simularBloqueio(compartimento: number): void {
  alterarStatus(compartimento, 'bloqueado');
}

function tratarMensagem(topicoRecebido: string, payload: Buffer): void {
  const texto = payload.toString();
  let dados: unknown;

  try {
    dados = JSON.parse(texto);
  } catch {
    console.warn(`SIMULADOR: payload invalido em ${topicoRecebido}: ${texto}`);
    return;
  }

  const compartimento = obterCompartimentoDoPayload(dados);

  if (!compartimento) {
    console.warn(`SIMULADOR: comando sem compartimento valido: ${texto}`);
    return;
  }

  console.log(`SIMULADOR: comando recebido ${topicoRecebido}`);
  console.log(`SIMULADOR: payload ${texto}`);

  if (topicoRecebido.endsWith('/liberar')) {
    void simularLiberacao(compartimento);
    return;
  }

  if (topicoRecebido.endsWith('/bloquear') || topicoRecebido.endsWith('/travar')) {
    simularBloqueio(compartimento);
    return;
  }

  console.log(`SIMULADOR: comando ignorado em ${topicoRecebido}`);
}

function imprimirAjuda(): void {
  console.log('');
  console.log('Comandos manuais:');
  console.log('  abrir 1     -> publica gaveta_aberta');
  console.log('  retirar 1   -> publica medicamento_retirado');
  console.log('  perdida 1   -> publica dose_perdida');
  console.log('  erro 1      -> marca gaveta como erro e publica erro');
  console.log('  status      -> envia heartbeat agora');
  console.log('  ajuda       -> mostra esta ajuda');
  console.log('  sair        -> encerra o simulador');
  console.log('');
}

function executarComandoManual(linha: string): void {
  const comando = interpretarComandoManual(linha);

  if (!comando) {
    console.log('SIMULADOR: comando invalido. Digite "ajuda".');
    return;
  }

  if (comando.tipo === 'ajuda') {
    imprimirAjuda();
    return;
  }

  if (comando.tipo === 'status') {
    publicarHeartbeat();
    return;
  }

  if (comando.tipo === 'sair') {
    encerrar();
    return;
  }

  if (comando.tipo === 'abrir') {
    alterarStatus(comando.compartimento, 'aberto');
    publicarEvento('gaveta_aberta', comando.compartimento, { origem: 'manual' });
    return;
  }

  if (comando.tipo === 'retirar') {
    publicarEvento('medicamento_retirado', comando.compartimento, { origem: 'manual' });
    alterarStatus(comando.compartimento, 'bloqueado');
    return;
  }

  if (comando.tipo === 'perdida') {
    publicarEvento('dose_perdida', comando.compartimento, { origem: 'manual' });
    return;
  }

  if (comando.tipo === 'erro') {
    alterarStatus(comando.compartimento, 'erro');
    publicarEvento('erro', comando.compartimento, { origem: 'manual' });
  }
}

function encerrar(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }

  cliente.end(true, () => {
    console.log('SIMULADOR: encerrado.');
    process.exit(0);
  });
}

cliente.on('connect', () => {
  const topicoComando = topico('comando', '#');

  console.log(`SIMULADOR: conectado ao broker ${brokerUrl}`);
  cliente.subscribe(topicoComando, { qos: 1 }, (erro) => {
    if (erro) {
      console.error(`SIMULADOR: erro ao assinar ${topicoComando}`, erro);
      return;
    }

    console.log(`SIMULADOR: escutando ${topicoComando}`);
    publicarHeartbeat();
    heartbeatTimer ??= setInterval(publicarHeartbeat, intervaloHeartbeat);
    imprimirAjuda();
  });
});

cliente.on('message', tratarMensagem);

cliente.on('error', (erro) => {
  console.error('SIMULADOR: erro MQTT', erro);
});

cliente.on('reconnect', () => {
  console.log('SIMULADOR: reconectando ao broker MQTT...');
});

cliente.on('offline', () => {
  console.warn('SIMULADOR: MQTT offline.');
});

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

terminal.on('line', executarComandoManual);
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
