export type ErroApi = {
  status: number;
  mensagem: string;
  detalhes?: unknown;
};

export type RespostaErroApi = {
  mensagem?: string;
  erro?: string;
  detalhes?: unknown;
};
