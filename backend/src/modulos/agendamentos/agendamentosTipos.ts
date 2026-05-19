import type {
  AgendamentoMedicamento,
  TipoAgendamentoMedicamento
} from '../../entidades/AgendamentoMedicamento.js';
import type { TipoUsuario } from '../../entidades/Usuario.js';

export type ContextoUsuarioAgendamento = {
  id: string;
  tipo: TipoUsuario;
};

export type CriarAgendamentoEntrada = {
  medicamentoId?: unknown;
  tipo?: unknown;
  diasSemana?: unknown;
  horarios?: unknown;
  intervaloHoras?: unknown;
  horarioInicio?: unknown;
  inicioEm?: unknown;
  fimEm?: unknown;
  toleranciaMinutos?: unknown;
  cuidados?: unknown;
};

export type AtualizarAgendamentoEntrada = Partial<CriarAgendamentoEntrada> & {
  ativo?: unknown;
};

export type ListarAgendamentosFiltros = {
  medicamentoId?: unknown;
  pacienteId?: unknown;
};

export type ListarProximasAdministracoesFiltros = {
  pacienteId?: unknown;
  data?: unknown;
};

export type AgendamentoNormalizado = {
  medicamentoId: string;
  tipo: TipoAgendamentoMedicamento;
  diasSemana: number[];
  horarios: string[] | null;
  intervaloHoras: number | null;
  horarioInicio: string | null;
  inicioEm: string | null;
  fimEm: string | null;
  toleranciaMinutos: number;
  cuidados: string | null;
  ativo: boolean;
};

export type ProximaAdministracao = {
  agendamentoId: string;
  medicamentoId: string;
  pacienteId: string;
  medicamentoNome: string;
  horarioPrevisto: string;
  tipo: TipoAgendamentoMedicamento;
  cuidados: string | null;
};

export interface AgendamentosServicoContrato {
  listar(
    filtros?: ListarAgendamentosFiltros,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<AgendamentoMedicamento[]>;
  listarProximasAdministracoes(
    filtros?: ListarProximasAdministracoesFiltros,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<ProximaAdministracao[]>;
  buscarPorId(
    id: string,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<AgendamentoMedicamento>;
  criar(
    entrada: CriarAgendamentoEntrada,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<AgendamentoMedicamento>;
  atualizar(
    id: string,
    entrada: AtualizarAgendamentoEntrada,
    contexto?: ContextoUsuarioAgendamento
  ): Promise<AgendamentoMedicamento>;
  remover(id: string, contexto?: ContextoUsuarioAgendamento): Promise<void>;
}
