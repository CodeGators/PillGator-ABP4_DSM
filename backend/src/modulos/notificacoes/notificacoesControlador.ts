import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type { RequestAutenticada } from '../../middlewares/autenticacao.js';
import type {
  ContextoUsuarioNotificacao,
  ListarNotificacoesFiltros,
  NotificacoesServicoContrato
} from './notificacoesTipos.js';

export class NotificacoesControlador {
  constructor(private readonly servico: NotificacoesServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const notificacoes = await this.servico.listar(this.obterFiltros(req));

    res.status(200).json(notificacoes);
  };

  public registrarTokenPush: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const token = await this.servico.registrarTokenPush(
      req.body,
      this.obterContexto(req)
    );

    res.status(201).json(token);
  };

  public processarProximasNotificacoes: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const resultado = await this.servico.processarProximasNotificacoes(req.body);

    res.status(200).json(resultado);
  };

  public verificarAtrasos: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const resultado = await this.servico.verificarAtrasos(req.body);

    res.status(200).json(resultado);
  };

  private obterFiltros(req: Request): ListarNotificacoesFiltros {
    const filtros: ListarNotificacoesFiltros = {};
    const pacienteId = this.obterFiltroTexto(req, 'pacienteId');
    const responsavelId = this.obterFiltroTexto(req, 'responsavelId');
    const status = this.obterFiltroTexto(req, 'status');

    if (pacienteId) {
      filtros.pacienteId = pacienteId;
    }

    if (responsavelId) {
      filtros.responsavelId = responsavelId;
    }

    if (status) {
      if (status !== 'pendente' && status !== 'enviada' && status !== 'erro') {
        throw new ErroHttp(
          400,
          'Filtro status deve ser pendente, enviada ou erro'
        );
      }

      filtros.status = status;
    }

    return filtros;
  }

  private obterFiltroTexto(req: Request, campo: string): string | undefined {
    const valor = req.query[campo];

    if (valor === undefined) {
      return undefined;
    }

    if (typeof valor !== 'string' || !valor.trim()) {
      throw new ErroHttp(400, `Filtro ${campo} deve ser texto`);
    }

    return valor.trim();
  }

  private obterContexto(
    req: Request
  ): ContextoUsuarioNotificacao | undefined {
    const usuario = (req as RequestAutenticada).usuario;

    if (!usuario) {
      return undefined;
    }

    return {
      id: usuario.sub,
      tipo: usuario.tipo
    };
  }
}
