import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  ListarUsuariosFiltros,
  UsuariosServicoContrato
} from './usuariosTipos.js';

export class UsuariosControlador {
  constructor(private readonly servico: UsuariosServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const usuarios = await this.servico.listar(this.obterFiltros(req));

    res.status(200).json(usuarios);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const usuario = await this.servico.buscarPorId(this.obterId(req));

    res.status(200).json(usuario);
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const usuario = await this.servico.criar(req.body);

    res.status(201).json(usuario);
  };

  public criarCadastroPublico: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (req.body?.tipo === 'administrador') {
      if (req.headers.authorization?.startsWith('Bearer ')) {
        next();
        return;
      }

      throw new ErroHttp(
        403,
        'Cadastro publico nao pode criar usuario administrador'
      );
    }

    if (req.body?.tipo !== 'responsavel') {
      throw new ErroHttp(
        400,
        'Cadastro publico aceita apenas usuario responsavel'
      );
    }

    const usuario = await this.servico.criar(req.body);

    res.status(201).json(usuario);
  };

  public atualizar: RequestHandler = async (req: Request, res: Response) => {
    const usuario = await this.servico.atualizar(this.obterId(req), req.body);

    res.status(200).json(usuario);
  };

  public remover: RequestHandler = async (req: Request, res: Response) => {
    await this.servico.remover(this.obterId(req));

    res.status(204).send();
  };

  private obterFiltros(req: Request): ListarUsuariosFiltros {
    const { tipo } = req.query;

    if (tipo === undefined) {
      return {};
    }

    if (tipo !== 'responsavel' && tipo !== 'administrador') {
      throw new ErroHttp(
        400,
        'Filtro tipo deve ser responsavel ou administrador'
      );
    }

    return { tipo };
  }

  private obterId(req: Request): string {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim()) {
      throw new ErroHttp(400, 'Id do usuario e obrigatorio');
    }

    return id;
  }
}
