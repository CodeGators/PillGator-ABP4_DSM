import type { Medicamento } from '../../entidades/Medicamento.js';
import type { TipoUsuario } from '../../entidades/Usuario.js';

export type ContextoUsuarioMedicamento = {
  id: string;
  tipo: TipoUsuario;
};

export type ListarMedicamentosFiltros = {
  pacienteId?: unknown;
};

export type CriarMedicamentoEntrada = {
  pacienteId?: unknown;
  baseMedicamentoId?: unknown;
  nome?: unknown;
  dosagem?: unknown;
  quantidadeAdministrada?: unknown;
  unidadeAdministracao?: unknown;
  observacoes?: unknown;
};

export type AtualizarMedicamentoEntrada = {
  baseMedicamentoId?: unknown;
  nome?: unknown;
  dosagem?: unknown;
  quantidadeAdministrada?: unknown;
  unidadeAdministracao?: unknown;
  observacoes?: unknown;
  ativo?: unknown;
};

export interface MedicamentosServicoContrato {
  listar(
    filtros?: ListarMedicamentosFiltros,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<Medicamento[]>;
  buscarPorId(
    id: string,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<Medicamento>;
  criar(
    entrada: CriarMedicamentoEntrada,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<Medicamento>;
  atualizar(
    id: string,
    entrada: AtualizarMedicamentoEntrada,
    contexto?: ContextoUsuarioMedicamento
  ): Promise<Medicamento>;
  remover(id: string, contexto?: ContextoUsuarioMedicamento): Promise<void>;
}
