import type { ComandoDispositivo } from '../../entidades/ComandoDispositivo.js';
import type { Compartimento, StatusCompartimento } from '../../entidades/Compartimento.js';
import type { Dispositivo } from '../../entidades/Dispositivo.js';
import type { EventoMedicamento } from '../../entidades/EventoMedicamento.js';
import type { TipoUsuario } from '../../entidades/Usuario.js';

export type ContextoUsuarioDispositivo = {
  id: string;
  tipo: TipoUsuario;
};

export type CriarDispositivoEntrada = {
  pacienteId?: unknown;
  nome?: unknown;
  identificador?: unknown;
  modelo?: unknown;
  ultimoSinalEm?: unknown;
};

export type AtualizarDispositivoEntrada = Partial<CriarDispositivoEntrada> & {
  ativo?: unknown;
};

export type CriarCompartimentoEntrada = {
  numero?: unknown;
  medicamentoId?: unknown;
  status?: unknown;
  observacoes?: unknown;
};

export type AtualizarCompartimentoEntrada = Partial<CriarCompartimentoEntrada> & {
  ativo?: unknown;
};

export type ListarDispositivosFiltros = {
  pacienteId?: string;
};

export type CriarComandoCompartimentoEntrada = {
  motivo?: unknown;
  agendamentoId?: unknown;
};

export type RegistrarEventoDispositivoEntrada = {
  chaveEvento?: unknown;
  tipo?: unknown;
  compartimentoId?: unknown;
  compartimentoNumero?: unknown;
  medicamentoId?: unknown;
  agendamentoId?: unknown;
  ocorridoEm?: unknown;
  descricao?: unknown;
  dados?: unknown;
};

export type DispositivoNormalizado = {
  pacienteId: string;
  nome: string;
  identificador: string;
  modelo: string | null;
  ultimoSinalEm: Date | null;
  ativo: boolean;
};

export type CompartimentoNormalizado = {
  dispositivoId: string;
  numero: number;
  medicamentoId: string | null;
  status: StatusCompartimento;
  observacoes: string | null;
  ativo: boolean;
};

export interface DispositivosServicoContrato {
  listar(
    filtros?: ListarDispositivosFiltros,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Dispositivo[]>;
  buscarPorId(
    id: string,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Dispositivo>;
  criar(
    entrada: CriarDispositivoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Dispositivo>;
  atualizar(
    id: string,
    entrada: AtualizarDispositivoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Dispositivo>;
  remover(id: string, contexto?: ContextoUsuarioDispositivo): Promise<void>;
  listarCompartimentos(
    dispositivoId: string,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Compartimento[]>;
  criarCompartimento(
    dispositivoId: string,
    entrada: CriarCompartimentoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Compartimento>;
  atualizarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: AtualizarCompartimentoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<Compartimento>;
  removerCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<void>;
  liberarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: CriarComandoCompartimentoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<ComandoDispositivo>;
  travarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: CriarComandoCompartimentoEntrada,
    contexto?: ContextoUsuarioDispositivo
  ): Promise<ComandoDispositivo>;
  listarComandosPendentes(identificador: string): Promise<ComandoDispositivo[]>;
  registrarEventoDispositivo(
    identificador: string,
    entrada: RegistrarEventoDispositivoEntrada
  ): Promise<EventoMedicamento>;
  obterStatus(id: string, contexto?: ContextoUsuarioDispositivo): Promise<{
    dispositivoId: string;
    identificador: string;
    online: boolean;
    ultimoSinalEm: Date | null;
  }>;
}
