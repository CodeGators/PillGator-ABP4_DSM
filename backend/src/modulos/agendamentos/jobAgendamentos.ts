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
let intervaloId: ReturnType<typeof setInterval> | null = null;

export function iniciarJobAgendamentos(): void {
  console.log('JOB: iniciando verificacao de agendamentos a cada 60s');

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
  const diaSemana = agora.getDay(); // 0=dom, 1=seg, ..., 6=sab
  const horaAtual = String(agora.getHours()).padStart(2, '0');
  const minutoAtual = String(agora.getMinutes()).padStart(2, '0');
  const horarioAtual = `${horaAtual}:${minutoAtual}`;

  const agendamentosRepo = AppDataSource.getRepository(AgendamentoMedicamento);
  const compartimentosRepo = AppDataSource.getRepository(Compartimento);
  const comandosRepo = AppDataSource.getRepository(ComandoDispositivo);

  // Buscar agendamentos ativos
  const agendamentos = await agendamentosRepo.find({
    where: { ativo: true },
    relations: ['medicamento']
  });

  for (const agendamento of agendamentos) {
    // Verificar se hoje e um dia valido
    if (!agendamento.diasSemana.includes(diaSemana)) {
      continue;
    }

    // Verificar se esta dentro do periodo do tratamento
    if (agendamento.inicioEm) {
      const inicio = new Date(agendamento.inicioEm);
      if (agora < inicio) continue;
    }

    if (agendamento.fimEm) {
      const fim = new Date(agendamento.fimEm);
      if (agora > fim) continue;
    }

    // Obter horarios a verificar
    const horariosParaVerificar = obterHorarios(agendamento);

    // Verificar se algum horario bate com agora
    if (!horariosParaVerificar.includes(horarioAtual)) {
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
        compartimento: compartimento.numero,
        medicamentoId: agendamento.medicamentoId,
        motivo: 'Horario do agendamento',
        agendamentoId: agendamento.id
      });
    }

    console.log(
      `JOB: comando liberar gaveta ${compartimento.numero} criado para ` +
      `dispositivo ${identificador ?? compartimento.dispositivoId} ` +
      `(medicamento: ${agendamento.medicamento?.nome ?? agendamento.medicamentoId}, ` +
      `horario: ${horarioAtual})`
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
