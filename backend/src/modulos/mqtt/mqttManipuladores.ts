import { AppDataSource } from '../../config/data-source.js';
import { Compartimento } from '../../entidades/Compartimento.js';
import { Dispositivo } from '../../entidades/Dispositivo.js';
import { EventoMedicamento } from '../../entidades/EventoMedicamento.js';
import type {
  OrigemEventoMedicamento,
  TipoEventoMedicamento
} from '../../entidades/EventoMedicamento.js';
import type { StatusCompartimento } from '../../entidades/Compartimento.js';

// Mapeamento de sufixo do topico para tipo de evento no banco
const mapaEventos: Record<string, TipoEventoMedicamento> = {
  gaveta_aberta: 'compartimento_aberto',
  medicamento_retirado: 'medicamento_retirado',
  dose_perdida: 'atraso',
  alerta_emitido: 'alerta_emitido',
  erro: 'falha'
};

const statusCompartimentoValidos: StatusCompartimento[] = [
  'bloqueado',
  'liberado',
  'aberto',
  'erro'
];

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
  const dispositivosRepo = AppDataSource.getRepository(Dispositivo);
  const compartimentosRepo = AppDataSource.getRepository(Compartimento);
  const dispositivo = await dispositivosRepo.findOne({
    where: { identificador: dispositivoIdentificador, ativo: true }
  });
  let compartimento: Compartimento | null = null;

  if (dispositivo) {
    dispositivo.ultimoSinalEm = dados.timestamp
      ? new Date(dados.timestamp)
      : new Date();
    await dispositivosRepo.save(dispositivo);

    const numeroCompartimento = dados.compartimento;

    if (Number.isInteger(numeroCompartimento)) {
      compartimento = await compartimentosRepo.findOne({
        where: {
          dispositivoId: dispositivo.id,
          numero: numeroCompartimento as number,
          ativo: true
        }
      });
    }
  } else {
    console.warn(
      `MQTT: evento de dispositivo desconhecido: ${dispositivoIdentificador}`
    );
  }

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
    medicamentoId: compartimento?.medicamentoId ?? null,
    tipo: tipoEvento,
    origem: 'iot' as OrigemEventoMedicamento,
    dispositivoId: dispositivoIdentificador,
    ocorridoEm: dados.timestamp ? new Date(dados.timestamp) : new Date(),
    descricao: dados.msgId ?? null,
    dados: {
      compartimento: dados.compartimento,
      compartimentoId: compartimento?.id ?? null,
      dispositivoBancoId: dispositivo?.id ?? null,
      payloadOriginal: dados
    }
  });

  await atualizarCompartimentoPorEvento(compartimento, tipoEvento);
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

  await atualizarCompartimentosPorHeartbeat(dispositivo.id, dados.gavetas);
  console.log(`MQTT: heartbeat atualizado para ${dispositivoIdentificador}`);
}

async function atualizarCompartimentosPorHeartbeat(
  dispositivoId: string,
  gavetas: PayloadHeartbeat['gavetas']
): Promise<void> {
  if (!gavetas || gavetas.length === 0) {
    return;
  }

  const compartimentosRepo = AppDataSource.getRepository(Compartimento);

  for (const gaveta of gavetas) {
    if (
      !Number.isInteger(gaveta.numero) ||
      !statusCompartimentoValidos.includes(gaveta.status as StatusCompartimento)
    ) {
      continue;
    }

    const compartimento = await compartimentosRepo.findOne({
      where: { dispositivoId, numero: gaveta.numero, ativo: true }
    });

    if (!compartimento) {
      continue;
    }

    compartimento.status = gaveta.status as StatusCompartimento;
    await compartimentosRepo.save(compartimento);
  }
}

async function atualizarCompartimentoPorEvento(
  compartimento: Compartimento | null,
  tipo: TipoEventoMedicamento
): Promise<void> {
  if (!compartimento) {
    return;
  }

  if (tipo === 'compartimento_aberto') {
    compartimento.status = 'aberto';
  } else if (tipo === 'medicamento_retirado') {
    compartimento.status = 'bloqueado';
  } else if (tipo === 'falha') {
    compartimento.status = 'erro';
  }

  await AppDataSource.getRepository(Compartimento).save(compartimento);
}
