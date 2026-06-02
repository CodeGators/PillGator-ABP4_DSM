import type { Medicamento } from './medicamento';

export type TipoAgendamento = 'horarios_fixos' | 'intervalo';

export type Agendamento = {
  id: string;
  medicamentoId: string;
  medicamento?: Medicamento;
  tipo: TipoAgendamento;
  diasSemana: number[];
  horarios: string[] | null;
  intervaloHoras: number | null;
  horarioInicio: string | null;
  inicioEm: string | null;
  fimEm: string | null;
  toleranciaMinutos: number;
  cuidados: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type ProximaAdministracao = {
  agendamentoId: string;
  medicamentoId: string;
  pacienteId: string;
  medicamentoNome: string;
  horarioPrevisto: string;
  tipo: TipoAgendamento;
  cuidados: string | null;
};

export type CriarAgendamentoEntrada = {
  medicamentoId: string;
  tipo: TipoAgendamento;
  diasSemana: number[];
  horarios?: string[] | null;
  intervaloHoras?: number | null;
  horarioInicio?: string | null;
  inicioEm?: string | null;
  fimEm?: string | null;
  toleranciaMinutos: number;
  cuidados?: string | null;
};

export type AtualizarAgendamentoEntrada = Partial<CriarAgendamentoEntrada> & {
  ativo?: boolean;
};
