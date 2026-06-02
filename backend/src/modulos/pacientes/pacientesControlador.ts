import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type { RequestAutenticada } from '../../middlewares/autenticacao.js';
import { formatarDataParaBr } from '../../utils/datas.js';
import type { Paciente } from '../../entidades/Paciente.js';
import type {
  ContextoUsuarioPaciente,
  PacientesServicoContrato
} from './pacientesTipos.js';

export class PacientesControlador {
  constructor(private readonly servico: PacientesServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const pacientes = await this.servico.listar(this.obterContexto(req));

    res.status(200).json(pacientes.map((paciente) => this.mapearPaciente(paciente)));
  };

  public listarMeus: RequestHandler = async (req: Request, res: Response) => {
    const pacientes = await this.servico.listarMeus(this.obterContexto(req));

    res.status(200).json(pacientes.map((paciente) => this.mapearPaciente(paciente)));
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const paciente = await this.servico.buscarPorId(
      this.obterPacienteId(req),
      this.obterContexto(req)
    );

    res.status(200).json(this.mapearPaciente(paciente));
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const paciente = await this.servico.criar(req.body, this.obterContexto(req));

    res.status(201).json(this.mapearPaciente(paciente));
  };

  public atualizar: RequestHandler = async (req: Request, res: Response) => {
    const paciente = await this.servico.atualizar(
      this.obterPacienteId(req),
      req.body,
      this.obterContexto(req)
    );

    res.status(200).json(this.mapearPaciente(paciente));
  };

  public remover: RequestHandler = async (req: Request, res: Response) => {
    await this.servico.remover(this.obterPacienteId(req), this.obterContexto(req));

    res.status(204).send();
  };

  public listarResponsaveis: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const responsaveis = await this.servico.listarResponsaveis(
      this.obterPacienteId(req),
      this.obterContexto(req)
    );

    res.status(200).json(responsaveis);
  };

  public vincularResponsavel: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const vinculo = await this.servico.vincularResponsavel(
      this.obterPacienteId(req),
      req.body,
      this.obterContexto(req)
    );

    res.status(201).json(vinculo);
  };

  public removerResponsavel: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    await this.servico.removerResponsavel(
      this.obterPacienteId(req),
      this.obterResponsavelId(req),
      this.obterContexto(req)
    );

    res.status(204).send();
  };

  private obterPacienteId(req: Request): string {
    const { id, pacienteId } = req.params;
    const valor = pacienteId ?? id;

    if (typeof valor !== 'string' || !valor.trim()) {
      throw new ErroHttp(400, 'Id do paciente e obrigatorio');
    }

    return valor;
  }

  private obterResponsavelId(req: Request): string {
    const { responsavelId } = req.params;

    if (typeof responsavelId !== 'string' || !responsavelId.trim()) {
      throw new ErroHttp(400, 'Id do responsavel e obrigatorio');
    }

    return responsavelId;
  }

  private obterContexto(req: Request): ContextoUsuarioPaciente | undefined {
    const usuario = (req as RequestAutenticada).usuario;

    if (!usuario) {
      return undefined;
    }

    return {
      id: usuario.sub,
      tipo: usuario.tipo
    };
  }

  private mapearPaciente(paciente: Paciente) {
    return {
      ...paciente,
      dataNascimento: formatarDataParaBr(paciente.dataNascimento)
    };
  }
}
