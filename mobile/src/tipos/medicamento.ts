export type BaseMedicamento = {
  id: string;
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
  criadoEm: string;
  atualizadoEm: string;
};

export type Medicamento = {
  id: string;
  pacienteId: string | null;
  baseMedicamentoId: string | null;
  nome: string;
  dosagem: string;
  quantidadeAdministrada: string | null;
  unidadeAdministracao: string | null;
  observacoes: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type CriarMedicamentoEntrada = {
  pacienteId: string;
  baseMedicamentoId?: string | null;
  nome: string;
  dosagem: string;
  quantidadeAdministrada: string;
  unidadeAdministracao: string;
  observacoes?: string | null;
};

export type AtualizarMedicamentoEntrada = Partial<
  Omit<CriarMedicamentoEntrada, 'pacienteId'>
> & {
  ativo?: boolean;
};
