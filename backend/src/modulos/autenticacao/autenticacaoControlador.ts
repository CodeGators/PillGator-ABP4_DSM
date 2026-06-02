import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type { RequestAutenticada } from '../../middlewares/autenticacao.js';
import type { AutenticacaoServicoContrato } from './autenticacaoTipos.js';

export class AutenticacaoControlador {
  constructor(private readonly servico: AutenticacaoServicoContrato) {}

  public login: RequestHandler = async (req: Request, res: Response) => {
    const resposta = await this.servico.login(req.body);

    res.status(200).json(resposta);
  };

  public solicitarRecuperacaoSenha: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const resposta = await this.servico.solicitarRecuperacaoSenha(req.body);

    res.status(200).json(resposta);
  };

  public redefinirSenha: RequestHandler = async (req: Request, res: Response) => {
    const resposta = await this.servico.redefinirSenha(req.body);

    res.status(200).json(resposta);
  };

  public me: RequestHandler = async (req: Request, res: Response) => {
    const usuario = (req as RequestAutenticada).usuario;

    if (!usuario) {
      throw new ErroHttp(401, 'Usuario nao autenticado');
    }

    const dadosUsuario = await this.servico.buscarUsuarioAutenticado(usuario.sub);

    res.status(200).json(dadosUsuario);
  };
}
