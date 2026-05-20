import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type { RequestAutenticada } from '../../middlewares/autenticacao.js';
import type {
  AgendamentosServicoContrato,
  ContextoUsuarioAgendamento,
  ListarProximasAdministracoesFiltros,
  ListarAgendamentosFiltros
} from './agendamentosTipos.js';

export class AgendamentosControlador {
  constructor(private readonly servico: AgendamentosServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const agendamentos = await this.servico.listar(
      this.obterFiltros(req),
      this.obterContexto(req)
    );

    res.status(200).json(agendamentos);
  };

  public listarProximasAdministracoes: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const administracoes = await this.servico.listarProximasAdministracoes(
      this.obterFiltrosProximasAdministracoes(req),
      this.obterContexto(req)
    );

    res.status(200).json(administracoes);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const agendamento = await this.servico.buscarPorId(
      this.obterId(req),
      this.obterContexto(req)
    );

    res.status(200).json(agendamento);
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const agendamento = await this.servico.criar(
      req.body,
      this.obterContexto(req)
    );

    res.status(201).json(agendamento);
  };

  public atualizar: RequestHandler = async (req: Request, res: Response) => {
    const agendamento = await this.servico.atualizar(
      this.obterId(req),
      req.body,
      this.obterContexto(req)
    );

    res.status(200).json(agendamento);
  };

  public remover: RequestHandler = async (req: Request, res: Response) => {
    await this.servico.remover(this.obterId(req), this.obterContexto(req));

    res.status(204).send();
  };

  private obterFiltros(req: Request): ListarAgendamentosFiltros {
    return {
      medicamentoId: this.validarFiltroTexto(req.query.medicamentoId, 'medicamentoId'),
      pacienteId: this.validarFiltroTexto(req.query.pacienteId, 'pacienteId')
    };
  }

  private obterFiltrosProximasAdministracoes(
    req: Request
  ): ListarProximasAdministracoesFiltros {
    return {
      pacienteId: this.validarFiltroTexto(req.query.pacienteId, 'pacienteId'),
      data: this.validarFiltroTexto(req.query.data, 'data')
    };
  }

  private validarFiltroTexto(
    valor: unknown,
    campo: string
  ): string | undefined {
    if (valor === undefined) {
      return undefined;
    }

    if (typeof valor !== 'string' || !valor.trim()) {
      throw new ErroHttp(400, `Filtro ${campo} deve ser texto`);
    }

    return valor;
  }

  private obterContexto(
    req: Request
  ): ContextoUsuarioAgendamento | undefined {
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
      throw new ErroHttp(400, 'Id do agendamento e obrigatorio');
    }

    return id;
  }
}
