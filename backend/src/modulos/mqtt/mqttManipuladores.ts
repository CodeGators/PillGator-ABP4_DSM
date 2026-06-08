import { AppDataSource } from '../../config/data-source.js';
import { Dispositivo } from '../../entidades/Dispositivo.js';
import { EventoMedicamento } from '../../entidades/EventoMedicamento.js';
import type {
  OrigemEventoMedicamento,
  TipoEventoMedicamento
} from '../../entidades/EventoMedicamento.js';

// Mapeamento de sufixo do topico para tipo de evento no banco
const mapaEventos: Record<string, TipoEventoMedicamento> = {
  gaveta_aberta: 'compartimento_aberto',
  medicamento_retirado: 'medicamento_retirado',
  dose_perdida: 'atraso',
  alerta_emitido: 'alerta_emitido',
  alerta_gaveta_aberta: 'alerta_emitido',
  erro: 'falha'
};

interface PayloadEvento {
  dispositivoId?: string;
  compartimento?: number;
  tipo?: string;
  timestamp?: string;
  msgId?: string;
  descricao?: string;
  dados?: Record<string, unknown>;
}

interface PayloadHeartbeat {
  dispositivoId?: string;
  uptimeSegundos?: number;
  gavetas?: Array<{ numero: number; status: string }>;
  timestamp?: string;
}

export async function processarMensagem(
  topico: string,
  payload: Buffer
): Promise<void> {
  try {
    const dados = JSON.parse(payload.toString());
    const partes = topico.split('/');
    // topico: pillgator/{dispositivoId}/{categoria}/{tipo}
    const dispositivoId = partes[1];
    const categoria = partes[2]; // 'evento' ou 'status'
    const tipoMsg = partes[3]; // 'gaveta_aberta', 'heartbeat', etc

    if (!dispositivoId || !categoria || !tipoMsg) {
      console.warn(`MQTT: topico invalido: ${topico}`);
      return;
    }

    if (categoria === 'status' && tipoMsg === 'heartbeat') {
      await processarHeartbeat(dispositivoId, dados as PayloadHeartbeat);
    } else if (categoria === 'evento') {
      await processarEvento(dispositivoId, tipoMsg, dados as PayloadEvento);
    } else {
      console.log(`MQTT: mensagem ignorada no topico ${topico}`);
    }
  } catch (erro) {
    console.error('MQTT: erro ao processar mensagem', erro);
  }
}

async function processarEvento(
  dispositivoIdentificador: string,
  tipoMsg: string,
  dados: PayloadEvento
): Promise<void> {
  const tipoEvento = mapaEventos[tipoMsg];

  if (!tipoEvento) {
    console.warn(`MQTT: tipo de evento desconhecido: ${tipoMsg}`);
    return;
  }

  const eventosRepo = AppDataSource.getRepository(EventoMedicamento);

  // Idempotencia: se ja processou este msgId, ignora
  if (dados.msgId) {
    const existente = await eventosRepo.findOne({
      where: { dispositivoId: dispositivoIdentificador, descricao: dados.msgId }
    });

    if (existente) {
      console.log(`MQTT: evento ${dados.msgId} ja processado, ignorando`);
      return;
    }
  }

  const evento = eventosRepo.create({
    tipo: tipoEvento,
    origem: 'iot' as OrigemEventoMedicamento,
    dispositivoId: dispositivoIdentificador,
    ocorridoEm: dados.timestamp ? new Date(dados.timestamp) : new Date(),
    descricao: dados.msgId ?? null,
    dados: {
      compartimento: dados.compartimento,
      payloadOriginal: dados
    }
  });

  await eventosRepo.save(evento);
  console.log(`MQTT: evento ${tipoEvento} salvo para dispositivo ${dispositivoIdentificador}`);
}

async function processarHeartbeat(
  dispositivoIdentificador: string,
  dados: PayloadHeartbeat
): Promise<void> {
  const dispositivosRepo = AppDataSource.getRepository(Dispositivo);

  const dispositivo = await dispositivosRepo.findOne({
    where: { identificador: dispositivoIdentificador, ativo: true }
  });

  if (!dispositivo) {
    console.warn(`MQTT: heartbeat de dispositivo desconhecido: ${dispositivoIdentificador}`);
    return;
  }

  dispositivo.ultimoSinalEm = dados.timestamp ? new Date(dados.timestamp) : new Date();
  await dispositivosRepo.save(dispositivo);
  console.log(`MQTT: heartbeat atualizado para ${dispositivoIdentificador}`);
}
