import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  BaseMedicamentosServicoContrato,
  ListarBaseMedicamentosFiltros
} from './baseMedicamentosTipos.js';

export class BaseMedicamentosControlador {
  constructor(private readonly servico: BaseMedicamentosServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const medicamentos = await this.servico.listar(this.obterFiltros(req));

    res.status(200).json(medicamentos);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const medicamento = await this.servico.buscarPorId(this.obterId(req));

    res.status(200).json(medicamento);
  };

  private obterFiltros(req: Request): ListarBaseMedicamentosFiltros {
    const { busca } = req.query;

    if (busca === undefined) {
      return {};
    }

    if (typeof busca !== 'string') {
      throw new ErroHttp(400, 'Filtro busca deve ser texto');
    }

    return { busca };
  }

  private obterId(req: Request): string {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim()) {
      throw new ErroHttp(400, 'Id do medicamento da base e obrigatorio');
    }

    return id;
  }
}
