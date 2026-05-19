import mqtt from 'mqtt';

import { env } from '../../config/env.js';
import { processarMensagem } from './mqttManipuladores.js';
import { INSCRICOES } from './mqttTopicos.js';

let cliente: mqtt.MqttClient | null = null;

export function iniciarMqtt(): void {
  if (!env.mqttBrokerUrl) {
    console.log('MQTT: MQTT_BROKER_URL nao configurada, pulando conexao MQTT');
    return;
  }

  console.log(`MQTT: conectando ao broker ${env.mqttBrokerUrl}...`);

  const opcoes: mqtt.IClientOptions = {
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 10000
  };

  if (env.mqttUsuario) {
    opcoes.username = env.mqttUsuario;
  }

  if (env.mqttSenha) {
    opcoes.password = env.mqttSenha;
  }

  cliente = mqtt.connect(env.mqttBrokerUrl, opcoes);

  cliente.on('connect', () => {
    console.log('MQTT: conectado ao broker com sucesso');

    for (const topico of INSCRICOES) {
      cliente!.subscribe(topico, { qos: 1 }, (erro) => {
        if (erro) {
          console.error(`MQTT: erro ao inscrever em ${topico}`, erro);
        } else {
          console.log(`MQTT: inscrito em ${topico}`);
        }
      });
    }
  });

  cliente.on('message', (topico: string, payload: Buffer) => {
    processarMensagem(topico, payload).catch((erro) => {
      console.error(`MQTT: erro ao processar mensagem de ${topico}`, erro);
    });
  });

  cliente.on('error', (erro) => {
    console.error('MQTT: erro de conexao', erro);
  });

  cliente.on('reconnect', () => {
    console.log('MQTT: reconectando ao broker...');
  });

  cliente.on('offline', () => {
    console.warn('MQTT: cliente ficou offline');
  });
}

export function publicarComando(
  dispositivoId: string,
  comando: string,
  dados: object
): void {
  if (!cliente || !cliente.connected) {
    console.warn('MQTT: cliente nao conectado, comando nao enviado');
    return;
  }

  const topico = `pillgator/${dispositivoId}/comando/${comando}`;

  cliente.publish(topico, JSON.stringify(dados), { qos: 1 }, (erro) => {
    if (erro) {
      console.error(`MQTT: erro ao publicar em ${topico}`, erro);
    } else {
      console.log(`MQTT: comando publicado em ${topico}`);
    }
  });
}

export function obterClienteMqtt(): mqtt.MqttClient | null {
  return cliente;
}
