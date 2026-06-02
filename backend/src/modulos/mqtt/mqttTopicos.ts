// Topicos MQTT do PillGator
// {id} sera substituido pelo identificador do dispositivo

export const TOPICOS = {
  // Dispositivo -> Backend (o backend ESCUTA esses)
  eventoGavetaAberta: 'pillgator/+/evento/gaveta_aberta',
  eventoMedicamentoRetirado: 'pillgator/+/evento/medicamento_retirado',
  eventoDosePerdida: 'pillgator/+/evento/dose_perdida',
  eventoAlerta: 'pillgator/+/evento/alerta_emitido',
  eventoErro: 'pillgator/+/evento/erro',
  statusHeartbeat: 'pillgator/+/status/heartbeat',

  // Backend -> Dispositivo (o backend PUBLICA nesses)
  comandoLiberar: (id: string) => `pillgator/${id}/comando/liberar`,
  comandoBloquear: (id: string) => `pillgator/${id}/comando/bloquear`,
  comandoSincronizar: (id: string) => `pillgator/${id}/comando/sincronizar`
} as const;

// Topicos que o backend deve escutar ao conectar
export const INSCRICOES = [
  'pillgator/+/evento/#',
  'pillgator/+/status/#'
];
