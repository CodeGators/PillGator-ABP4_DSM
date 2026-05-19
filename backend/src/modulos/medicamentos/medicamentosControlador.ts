import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type { RequestAutenticada } from '../../middlewares/autenticacao.js';
import type {
  ContextoUsuarioMedicamento,
  ListarMedicamentosFiltros,
  MedicamentosServicoContrato
} from './medicamentosTipos.js';

export class MedicamentosControlador {
  constructor(private readonly servico: MedicamentosServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const medicamentos = await this.servico.listar(
      this.obterFiltros(req),
      this.obterContexto(req)
    );

    res.status(200).json(medicamentos);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const medicamento = await this.servico.buscarPorId(
      this.obterId(req),
      this.obterContexto(req)
    );

    res.status(200).json(medicamento);
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const medicamento = await this.servico.criar(
      req.body,
      this.obterContexto(req)
    );

    res.status(201).json(medicamento);
  };

  public atualizar: RequestHandler = async (req: Request, res: Response) => {
    const medicamento = await this.servico.atualizar(
      this.obterId(req),
      req.body,
      this.obterContexto(req)
    );

    res.status(200).json(medicamento);
  };

  public remover: RequestHandler = async (req: Request, res: Response) => {
    await this.servico.remover(this.obterId(req), this.obterContexto(req));

    res.status(204).send();
  };

  private obterFiltros(req: Request): ListarMedicamentosFiltros {
    return {
      pacienteId: req.query.pacienteId
    };
  }

  private obterContexto(
    req: Request
  ): ContextoUsuarioMedicamento | undefined {
    const usuario = (req as RequestAutenticada).usuario;

    if (!usuario) {
      return undefined;
    }

    return {
      id: usuario.sub,
      tipo: usuario.tipo
    };
  }

  private obterId(req: Request): string {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim()) {
      throw new ErroHttp(400, 'Id do medicamento e obrigatorio');
    }

    return id;
  }
}
