import type { Paciente } from '../../entidades/Paciente.js';
import type { PacienteResponsavel } from '../../entidades/PacienteResponsavel.js';
import type { TipoUsuario } from '../../entidades/Usuario.js';

export type CriarPacienteEntrada = {
  usuarioId?: unknown;
  nome?: unknown;
  dataNascimento?: unknown;
  observacoes?: unknown;
  fotoUrl?: unknown;
  souEuMesmo?: unknown;
};

export type AtualizarPacienteEntrada = Partial<CriarPacienteEntrada> & {
  ativo?: unknown;
};

export type VincularResponsavelEntrada = {
  responsavelId?: unknown;
  parentesco?: unknown;
  recebeNotificacoes?: unknown;
};

export type PacienteNormalizado = {
  usuarioId: string | null;
  nome: string;
  dataNascimento: string | null;
  observacoes: string | null;
  fotoUrl: string | null;
  ativo: boolean;
};

export type VinculoResponsavelNormalizado = {
  pacienteId: string;
  responsavelId: string;
  parentesco: string | null;
  recebeNotificacoes: boolean;
  ativo: boolean;
};

export type ContextoUsuarioPaciente = {
  id: string;
  tipo: TipoUsuario;
};

export interface PacientesServicoContrato {
  listar(contexto?: ContextoUsuarioPaciente): Promise<Paciente[]>;
  listarMeus(contexto?: ContextoUsuarioPaciente): Promise<Paciente[]>;
  buscarPorId(id: string, contexto?: ContextoUsuarioPaciente): Promise<Paciente>;
  criar(
    entrada: CriarPacienteEntrada,
    contexto?: ContextoUsuarioPaciente
  ): Promise<Paciente>;
  atualizar(
    id: string,
    entrada: AtualizarPacienteEntrada,
    contexto?: ContextoUsuarioPaciente
  ): Promise<Paciente>;
  remover(id: string, contexto?: ContextoUsuarioPaciente): Promise<void>;
  listarResponsaveis(
    pacienteId: string,
    contexto?: ContextoUsuarioPaciente
  ): Promise<PacienteResponsavel[]>;
  vincularResponsavel(
    pacienteId: string,
    entrada: VincularResponsavelEntrada,
    contexto?: ContextoUsuarioPaciente
  ): Promise<PacienteResponsavel>;
  removerResponsavel(
    pacienteId: string,
    responsavelId: string,
    contexto?: ContextoUsuarioPaciente
  ): Promise<void>;
}
