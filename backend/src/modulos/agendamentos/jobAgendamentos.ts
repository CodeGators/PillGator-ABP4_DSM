// ===========================================================
// Job de Agendamentos — Verifica horarios e dispara comandos
// ===========================================================
// Roda a cada 60 segundos. Para cada agendamento ativo cujo
// horario bate com o momento atual (com tolerancia), cria um
// ComandoDispositivo e publica via MQTT pro ESP32.
// ===========================================================

import { Between, In } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { AgendamentoMedicamento } from '../../entidades/AgendamentoMedicamento.js';
import { ComandoDispositivo } from '../../entidades/ComandoDispositivo.js';
import { Compartimento } from '../../entidades/Compartimento.js';
import { publicarComando } from '../mqtt/mqttCliente.js';

const INTERVALO_MS = 60_000; // 1 minuto
const FUSO_AGENDAMENTOS = 'America/Sao_Paulo';
const diasSemanaIntl: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};
let intervaloId: ReturnType<typeof setInterval> | null = null;

type AgoraOperacional = {
  dataIso: string;
  diaSemana: number;
  horarioAtual: string;
};

export function iniciarJobAgendamentos(): void {
  console.log(
    `JOB: iniciando verificacao de agendamentos a cada 60s ` +
    `(fuso operacional: ${FUSO_AGENDAMENTOS})`
  );

  // Primeira execucao imediata
  verificarAgendamentos().catch((erro) => {
    console.error('JOB: erro na primeira verificacao', erro);
  });

  intervaloId = setInterval(() => {
    verificarAgendamentos().catch((erro) => {
      console.error('JOB: erro ao verificar agendamentos', erro);
    });
  }, INTERVALO_MS);
}

export function pararJobAgendamentos(): void {
  if (intervaloId) {
    clearInterval(intervaloId);
    intervaloId = null;
    console.log('JOB: parado');
  }
}

async function verificarAgendamentos(): Promise<void> {
  const agora = new Date();
  const { dataIso, diaSemana, horarioAtual } = obterAgoraOperacional(agora);

  const agendamentosRepo = AppDataSource.getRepository(AgendamentoMedicamento);
  const compartimentosRepo = AppDataSource.getRepository(Compartimento);
  const comandosRepo = AppDataSource.getRepository(ComandoDispositivo);
  const resumo = {
    total: 0,
    foraDia: 0,
    foraPeriodo: 0,
    foraHorario: 0,
    semCompartimento: 0,
    duplicado: 0,
    semIdentificador: 0,
    enviados: 0
  };

  // Buscar agendamentos ativos
  const agendamentos = await agendamentosRepo.find({
    where: { ativo: true },
    relations: ['medicamento']
  });

  for (const agendamento of agendamentos) {
    resumo.total += 1;

    // Verificar se hoje e um dia valido
    if (!agendamento.diasSemana.includes(diaSemana)) {
      resumo.foraDia += 1;
      continue;
    }

    // Verificar se esta dentro do periodo do tratamento
    if (agendamento.inicioEm && dataIso < agendamento.inicioEm) {
      resumo.foraPeriodo += 1;
      continue;
    }

    if (agendamento.fimEm && dataIso > agendamento.fimEm) {
      resumo.foraPeriodo += 1;
      continue;
    }

    // Obter horarios a verificar
    const horariosParaVerificar = obterHorarios(agendamento);

    // Verificar se algum horario bate com agora
    if (!horariosParaVerificar.includes(horarioAtual)) {
      resumo.foraHorario += 1;
      continue;
    }

    // Buscar compartimento que tem esse medicamento
    const compartimento = await compartimentosRepo.findOne({
      where: {
        medicamentoId: agendamento.medicamentoId,
        ativo: true
      },
      relations: ['dispositivo']
    });

    if (!compartimento) {
      resumo.semCompartimento += 1;
      console.warn(
        `JOB: agendamento ${agendamento.id} no horario ${horarioAtual} ` +
        `ignorado porque o medicamento ${agendamento.medicamentoId} ` +
        'nao esta associado a nenhuma gaveta ativa'
      );
      continue; // Medicamento nao esta em nenhuma gaveta
    }

    // Verificar se ja criou comando pra este agendamento neste minuto
    const inicioMinuto = new Date(agora);
    inicioMinuto.setSeconds(0, 0);
    const fimMinuto = new Date(agora);
    fimMinuto.setSeconds(59, 999);

    const comandoExistente = await comandosRepo.findOne({
      where: {
        dispositivoId: compartimento.dispositivoId,
        compartimentoId: compartimento.id,
        tipo: 'liberar_gaveta',
        status: In(['pendente', 'enviado']),
        criadoEm: Between(inicioMinuto, fimMinuto)
      }
    });

    if (comandoExistente) {
      resumo.duplicado += 1;
      continue; // Ja disparou neste minuto
    }

    // Criar comando
    const comando = comandosRepo.create({
      dispositivoId: compartimento.dispositivoId,
      compartimentoId: compartimento.id,
      tipo: 'liberar_gaveta',
      status: 'enviado',
      enviadoEm: agora,
      dados: {
        numeroCompartimento: compartimento.numero,
        medicamentoId: agendamento.medicamentoId,
        medicamentoNome: agendamento.medicamento?.nome ?? 'Medicamento',
        agendamentoId: agendamento.id,
        horarioAgendado: horarioAtual,
        motivo: 'Horario do agendamento'
      }
    });

    await comandosRepo.save(comando);

    // Publicar MQTT
    const identificador = compartimento.dispositivo?.identificador;

    if (identificador) {
      publicarComando(identificador, 'liberar', {
        acao: 'liberar',
        comandoId: comando.id,
        msgId: comando.id,
        compartimento: compartimento.numero
      });
      resumo.enviados += 1;
    } else {
      resumo.semIdentificador += 1;
      console.warn(
        `JOB: comando ${comando.id} criado, mas o dispositivo ` +
        `${compartimento.dispositivoId} nao tem identificador MQTT`
      );
    }

    console.log(
      `JOB: comando liberar gaveta ${compartimento.numero} criado para ` +
      `dispositivo ${identificador ?? compartimento.dispositivoId} ` +
      `(medicamento: ${agendamento.medicamento?.nome ?? agendamento.medicamentoId}, ` +
      `horario: ${horarioAtual})`
    );
  }

  if (resumo.total > 0) {
    console.log(
      `JOB: resumo ${dataIso} ${horarioAtual} ${FUSO_AGENDAMENTOS} ` +
      JSON.stringify(resumo)
    );
  }
}

function obterHorarios(agendamento: AgendamentoMedicamento): string[] {
  if (agendamento.tipo === 'horarios_fixos' && agendamento.horarios) {
    return agendamento.horarios;
  }

  if (
    agendamento.tipo === 'intervalo' &&
    agendamento.intervaloHoras &&
    agendamento.horarioInicio
  ) {
    const horarios: string[] = [];
    const partes = agendamento.horarioInicio.split(':').map(Number);
    const h = partes[0] ?? 0;
    const m = partes[1] ?? 0;
    let horaCorrente = h;

    // Gerar horarios do dia baseado no intervalo
    while (horaCorrente < 24) {
      horarios.push(
        `${String(horaCorrente).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      );
      horaCorrente += agendamento.intervaloHoras;
    }

    return horarios;
  }

  return [];
}

function obterAgoraOperacional(data: Date): AgoraOperacional {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_AGENDAMENTOS,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(data);
  const valores = Object.fromEntries(
    partes.map((parte) => [parte.type, parte.value])
  );
  const diaSemana = diasSemanaIntl[valores.weekday ?? ''];

  if (diaSemana === undefined) {
    throw new Error('JOB: nao foi possivel calcular o dia da semana operacional');
  }

  return {
    dataIso: `${valores.year}-${valores.month}-${valores.day}`,
    diaSemana,
    horarioAtual: `${valores.hour}:${valores.minute}`
  };
}
