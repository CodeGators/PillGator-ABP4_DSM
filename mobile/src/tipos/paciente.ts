import type { Usuario } from './usuario';

export type Paciente = {
  id: string;
  usuarioId: string | null;
  nome: string;
  dataNascimento: string | null;
  observacoes: string | null;
  fotoUrl?: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type CriarPacienteEntrada = {
  nome: string;
  dataNascimento?: string | null;
  observacoes?: string | null;
  fotoUrl?: string | null;
  souEuMesmo?: boolean;
};

export type AtualizarPacienteEntrada = Partial<CriarPacienteEntrada> & {
  ativo?: boolean;
};

export type PacienteResponsavel = {
  id: string;
  pacienteId: string;
  responsavelId: string;
  responsavel?: Usuario;
  parentesco: string | null;
  recebeNotificacoes: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};
