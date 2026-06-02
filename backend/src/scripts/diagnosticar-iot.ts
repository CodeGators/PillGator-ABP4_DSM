import mqtt from 'mqtt';

import { AppDataSource } from '../config/data-source.js';
import { env } from '../config/env.js';
import { Dispositivo } from '../entidades/Dispositivo.js';
import { EventoMedicamento } from '../entidades/EventoMedicamento.js';
import {
  criarGavetasSimuladas,
  criarMsgId,
  criarPayloadEvento,
  criarPayloadHeartbeat
} from '../modulos/mqtt/simuladorEsp32.js';

const dispositivoId = env.simuladorDeviceId;
const compartimento = Number(process.env.IOT_DIAGNOSTICO_GAVETA ?? 1);
const timeoutMs = Number(process.env.IOT_DIAGNOSTICO_TIMEOUT_MS ?? 15000);
const intervaloPollMs = 1000;

function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function topico(categoria: string, tipo: string): string {
  return `pillgator/${dispositivoId}/${categoria}/${tipo}`;
}

async function conectarMqtt(): Promise<mqtt.MqttClient> {
  if (!env.mqttBrokerUrl) {
    throw new Error('Configure MQTT_BROKER_URL antes de rodar o diagnostico.');
  }

  const opcoesMqtt: mqtt.IClientOptions = {
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 0
  };
  const usuario = env.mqttEsp32Usuario || env.mqttUsuario;
  const senha = env.mqttEsp32Senha || env.mqttSenha;

  if (usuario) {
    opcoesMqtt.username = usuario;
  }

  if (senha) {
    opcoesMqtt.password = senha;
  }

  const cliente = mqtt.connect(env.mqttBrokerUrl, opcoesMqtt);

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout conectando ao broker MQTT.'));
    }, 10000);

    cliente.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });

    cliente.once('error', (erro) => {
      clearTimeout(timer);
      reject(erro);
    });
  });

  return cliente;
}

async function publicar(
  cliente: mqtt.MqttClient,
  topicoDestino: string,
  payload: object
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    cliente.publish(
      topicoDestino,
      JSON.stringify(payload),
      { qos: 1 },
      (erro) => {
        if (erro) {
          reject(erro);
          return;
        }

        resolve();
      }
    );
  });
}

async function aguardarProcessamento(
  msgId: string,
  iniciadoEm: Date
): Promise<void> {
  const eventosRepo = AppDataSource.getRepository(EventoMedicamento);
  const dispositivosRepo = AppDataSource.getRepository(Dispositivo);
  const limite = Date.now() + timeoutMs;

  while (Date.now() < limite) {
    const dispositivo = await dispositivosRepo.findOne({
      where: { identificador: dispositivoId, ativo: true }
    });
    const evento = await eventosRepo.findOne({
      where: { dispositivoId, descricao: msgId }
    });
    const heartbeatOk =
      dispositivo?.ultimoSinalEm &&
      dispositivo.ultimoSinalEm.getTime() >= iniciadoEm.getTime();

    if (heartbeatOk && evento) {
      return;
    }

    await dormir(intervaloPollMs);
  }

  throw new Error(
    `Backend nao processou heartbeat/evento MQTT em ${timeoutMs}ms. Verifique variaveis MQTT no Railway, logs do backend e se o dispositivo ${dispositivoId} existe no banco.`
  );
}

async function diagnosticarIot(): Promise<void> {
  await AppDataSource.initialize();

  const dispositivosRepo = AppDataSource.getRepository(Dispositivo);
  const dispositivo = await dispositivosRepo.findOne({
    where: { identificador: dispositivoId, ativo: true }
  });

  if (!dispositivo) {
    throw new Error(
      `Dispositivo ${dispositivoId} nao encontrado no banco. Crie/vincule o dispositivo antes do diagnostico.`
    );
  }

  const cliente = await conectarMqtt();
  const iniciadoEm = new Date();
  const msgId = criarMsgId(dispositivoId, Date.now());

  try {
    console.log(`IOT: conectado ao broker ${env.mqttBrokerUrl}`);
    console.log(`IOT: publicando heartbeat de ${dispositivoId}`);
    await publicar(
      cliente,
      topico('status', 'heartbeat'),
      criarPayloadHeartbeat(
        dispositivoId,
        criarGavetasSimuladas(env.simuladorGavetas),
        Date.now(),
        iniciadoEm
      )
    );

    console.log(`IOT: publicando evento gaveta_aberta com msgId ${msgId}`);
    await publicar(
      cliente,
      topico('evento', 'gaveta_aberta'),
      criarPayloadEvento(
        dispositivoId,
        'gaveta_aberta',
        compartimento,
        msgId,
        { origem: 'diagnostico-iot' },
        new Date()
      )
    );

    console.log('IOT: aguardando backend processar MQTT...');
    await aguardarProcessamento(msgId, iniciadoEm);
    console.log('IOT: diagnostico concluido com sucesso.');
    console.log(
      'IOT: fluxo validado: MQTT -> backend -> banco. Agora teste liberar/travar pelo app.'
    );
  } finally {
    cliente.end(true);
  }
}

diagnosticarIot()
  .catch((erro: unknown) => {
    console.error('IOT: diagnostico falhou', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
