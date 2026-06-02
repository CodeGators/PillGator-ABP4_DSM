import type { ErroApi } from '@/src/tipos/api';

type ViaCepResposta = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export type EnderecoCep = {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export const cepsServico = {
  async consultar(cep: string): Promise<EnderecoCep> {
    const cepNormalizado = cep.replace(/\D/g, '');

    if (cepNormalizado.length !== 8) {
      throw { status: 0, mensagem: 'Informe um CEP com 8 digitos.' } satisfies ErroApi;
    }

    const resposta = await fetch(`https://viacep.com.br/ws/${cepNormalizado}/json/`);

    if (!resposta.ok) {
      throw { status: resposta.status, mensagem: 'Nao foi possivel consultar o CEP.' } satisfies ErroApi;
    }

    const dados = (await resposta.json()) as ViaCepResposta;

    if (dados.erro) {
      throw { status: 404, mensagem: 'CEP nao encontrado.' } satisfies ErroApi;
    }

    return {
      cep: cepNormalizado,
      rua: dados.logradouro ?? '',
      bairro: dados.bairro ?? '',
      cidade: dados.localidade ?? '',
      uf: dados.uf ?? '',
    };
  },
};
