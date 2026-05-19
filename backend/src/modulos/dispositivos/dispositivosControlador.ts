import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type { RequestAutenticada } from '../../middlewares/autenticacao.js';
import type {
  ContextoUsuarioDispositivo,
  DispositivosServicoContrato,
  ListarDispositivosFiltros
} from './dispositivosTipos.js';

export class DispositivosControlador {
  constructor(private readonly servico: DispositivosServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const dispositivos = await this.servico.listar(
      this.obterFiltros(req),
      this.obterContexto(req)
    );

    res.status(200).json(dispositivos);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const dispositivo = await this.servico.buscarPorId(
      this.obterId(req),
      this.obterContexto(req)
    );

    res.status(200).json(dispositivo);
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const dispositivo = await this.servico.criar(
      req.body,
      this.obterContexto(req)
    );

    res.status(201).json(dispositivo);
  };

  public atualizar: RequestHandler = async (req: Request, res: Response) => {
    const dispositivo = await this.servico.atualizar(
      this.obterId(req),
      req.body,
      this.obterContexto(req)
    );

    res.status(200).json(dispositivo);
  };

  public remover: RequestHandler = async (req: Request, res: Response) => {
    await this.servico.remover(this.obterId(req), this.obterContexto(req));

    res.status(204).send();
  };

  public listarCompartimentos: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const compartimentos = await this.servico.listarCompartimentos(
      this.obterDispositivoId(req),
      this.obterContexto(req)
    );

    res.status(200).json(compartimentos);
  };

  public criarCompartimento: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const compartimento = await this.servico.criarCompartimento(
      this.obterDispositivoId(req),
      req.body,
      this.obterContexto(req)
    );

    res.status(201).json(compartimento);
  };

  public atualizarCompartimento: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const compartimento = await this.servico.atualizarCompartimento(
      this.obterDispositivoId(req),
      this.obterCompartimentoId(req),
      req.body,
      this.obterContexto(req)
    );

    res.status(200).json(compartimento);
  };

  public removerCompartimento: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    await this.servico.removerCompartimento(
      this.obterDispositivoId(req),
      this.obterCompartimentoId(req),
      this.obterContexto(req)
    );

    res.status(204).send();
  };

  public liberarCompartimento: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const comando = await this.servico.liberarCompartimento(
      this.obterDispositivoId(req),
      this.obterCompartimentoId(req),
      req.body,
      this.obterContexto(req)
    );

    res.status(201).json(comando);
  };

  public travarCompartimento: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const comando = await this.servico.travarCompartimento(
      this.obterDispositivoId(req),
      this.obterCompartimentoId(req),
      req.body,
      this.obterContexto(req)
    );

    res.status(201).json(comando);
  };

  public listarComandosPendentes: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const comandos = await this.servico.listarComandosPendentes(
      this.obterIdentificador(req)
    );

    res.status(200).json(comandos);
  };

  public registrarEventoDispositivo: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const evento = await this.servico.registrarEventoDispositivo(
      this.obterIdentificador(req),
      req.body
    );

    res.status(201).json(evento);
  };

  public obterStatus: RequestHandler = async (req: Request, res: Response) => {
    const status = await this.servico.obterStatus(
      this.obterId(req),
      this.obterContexto(req)
    );

    res.status(200).json(status);
  };

  private obterFiltros(req: Request): ListarDispositivosFiltros {
    const { pacienteId } = req.query;

    if (pacienteId === undefined) {
      return {};
    }

    if (typeof pacienteId !== 'string' || !pacienteId.trim()) {
      throw new ErroHttp(400, 'Filtro pacienteId deve ser texto');
    }

    return { pacienteId: pacienteId.trim() };
  }

  private obterContexto(
    req: Request
  ): ContextoUsuarioDispositivo | undefined {
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
      throw new ErroHttp(400, 'Id do dispositivo e obrigatorio');
    }

    return id;
  }

  private obterDispositivoId(req: Request): string {
    const { dispositivoId } = req.params;

    if (typeof dispositivoId !== 'string' || !dispositivoId.trim()) {
      throw new ErroHttp(400, 'Id do dispositivo e obrigatorio');
    }

    return dispositivoId;
  }

  private obterCompartimentoId(req: Request): string {
    const { compartimentoId } = req.params;

    if (typeof compartimentoId !== 'string' || !compartimentoId.trim()) {
      throw new ErroHttp(400, 'Id do compartimento e obrigatorio');
    }

    return compartimentoId;
  }

  private obterIdentificador(req: Request): string {
    const { identificador } = req.params;

    if (typeof identificador !== 'string' || !identificador.trim()) {
      throw new ErroHttp(400, 'Identificador do dispositivo e obrigatorio');
    }

    return identificador.trim();
  }
}
