import type { BaseMedicamento } from '../../entidades/BaseMedicamento.js';

export type ListarBaseMedicamentosFiltros = {
  busca?: string;
};

export type BaseMedicamentoCsv = {
  nomeProduto: string;
  categoriaProduto: string | null;
  principioAtivo: string | null;
  concentracao: string | null;
  destinacao: string | null;
  formaFisica: string | null;
  restricaoPrescricao: string | null;
  restritoHospitalar: boolean;
  restricaoUso: string | null;
  fonte: string;
};

export type ResultadoImportacaoBaseMedicamentos = {
  totalLido: number;
  totalImportado: number;
};

export interface BaseMedicamentosServicoContrato {
  listar(filtros?: ListarBaseMedicamentosFiltros): Promise<BaseMedicamento[]>;
  buscarPorId(id: string): Promise<BaseMedicamento>;
  importarCsv(caminhoArquivo: string): Promise<ResultadoImportacaoBaseMedicamentos>;
}
