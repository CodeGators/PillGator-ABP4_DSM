import axios from 'axios';

import { env } from '../../config/env.js';
import type {
  EnviadorPush,
  MensagemPush,
  ResultadoEnvioPush
} from './notificacoesTipos.js';

type RespostaExpoPush = {
  data?: Array<{
    status?: string;
    id?: string;
    message?: string;
    details?: unknown;
  }>;
};

export class EnviadorPushExpo implements EnviadorPush {
  public async enviar(mensagem: MensagemPush): Promise<ResultadoEnvioPush> {
    try {
      const resposta = await axios.post<RespostaExpoPush>(
        env.expoPushUrl,
        mensagem.tokens.map((token) => ({
          to: token,
          sound: 'default',
          title: mensagem.titulo,
          body: mensagem.mensagem,
          data: mensagem.dados ?? {}
        })),
        {
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json'
          }
        }
      );
      const tickets = resposta.data.data ?? [];
      const algumErro = tickets.some((ticket) => ticket.status === 'error');

      return {
        sucesso: tickets.length > 0 && !algumErro,
        detalhes: resposta.data
      };
    } catch (erro) {
      const mensagemErro = erro instanceof Error
        ? erro.message
        : 'Erro desconhecido ao enviar push';

      return {
        sucesso: false,
        erro: mensagemErro
      };
    }
  }
}
