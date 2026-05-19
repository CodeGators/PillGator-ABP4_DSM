import cors from 'cors';
import express from 'express';
import type { RequestHandler } from 'express';

import { configurarSwagger } from './docs/swagger.js';
import { autenticar, autorizar } from './middlewares/autenticacao.js';
import { tratarErros } from './middlewares/tratarErros.js';
import { criarAgendamentosRotas } from './modulos/agendamentos/agendamentosRotas.js';
import type { AgendamentosServicoContrato } from './modulos/agendamentos/agendamentosTipos.js';
import { criarAutenticacaoRotas } from './modulos/autenticacao/autenticacaoRotas.js';
import type { AutenticacaoServicoContrato } from './modulos/autenticacao/autenticacaoTipos.js';
import { criarBaseMedicamentosRotas } from './modulos/baseMedicamentos/baseMedicamentosRotas.js';
import type { BaseMedicamentosServicoContrato } from './modulos/baseMedicamentos/baseMedicamentosTipos.js';
import {
  criarDispositivosIotRotas,
  criarDispositivosRotas
} from './modulos/dispositivos/dispositivosRotas.js';
import type { DispositivosServicoContrato } from './modulos/dispositivos/dispositivosTipos.js';
import { criarEventosRotas } from './modulos/eventos/eventosRotas.js';
import type { EventosServicoContrato } from './modulos/eventos/eventosTipos.js';
import { criarMedicamentosRotas } from './modulos/medicamentos/medicamentosRotas.js';
import type { MedicamentosServicoContrato } from './modulos/medicamentos/medicamentosTipos.js';
import { criarNotificacoesRotas } from './modulos/notificacoes/notificacoesRotas.js';
import type { NotificacoesServicoContrato } from './modulos/notificacoes/notificacoesTipos.js';
import { criarPacientesRotas } from './modulos/pacientes/pacientesRotas.js';
import type { PacientesServicoContrato } from './modulos/pacientes/pacientesTipos.js';
import { criarUsuariosRotas } from './modulos/usuarios/usuariosRotas.js';
import type { UsuariosServicoContrato } from './modulos/usuarios/usuariosTipos.js';
import type { TipoUsuario } from './entidades/Usuario.js';

type CriarAppOpcoes = {
  agendamentosServico?: AgendamentosServicoContrato;
  autenticacaoAtiva?: boolean;
  autenticacaoServico?: AutenticacaoServicoContrato;
  baseMedicamentosServico?: BaseMedicamentosServicoContrato;
  dispositivosServico?: DispositivosServicoContrato;
  eventosServico?: EventosServicoContrato;
  medicamentosServico?: MedicamentosServicoContrato;
  notificacoesServico?: NotificacoesServicoContrato;
  pacientesServico?: PacientesServicoContrato;
  usuariosServico?: UsuariosServicoContrato;
};

export function criarApp(opcoes: CriarAppOpcoes = {}) {
  const app = express();
  const autenticacaoAtiva = opcoes.autenticacaoAtiva !== false;
  const protegerPorTipo = (...tipos: TipoUsuario[]): RequestHandler =>
    autenticacaoAtiva ? autorizar(...tipos) : (_req, _res, next) => next();

  app.use(cors());
  app.use(express.json());

  configurarSwagger(app);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/saude', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/auth', criarAutenticacaoRotas(opcoes.autenticacaoServico));
  app.use(
    '/usuarios',
    criarUsuariosRotas(opcoes.usuariosServico, {
      incluirCadastroPublico: true,
      incluirGestao: false
    })
  );
  app.use(
    '/iot/dispositivos',
    criarDispositivosIotRotas(opcoes.dispositivosServico)
  );

  if (autenticacaoAtiva) {
    app.use(autenticar);
  }

  app.use(
    '/base-medicamentos',
    protegerPorTipo('administrador', 'responsavel'),
    criarBaseMedicamentosRotas(opcoes.baseMedicamentosServico)
  );
  app.use(
    '/medicamentos',
    protegerPorTipo('administrador', 'responsavel'),
    criarMedicamentosRotas(opcoes.medicamentosServico)
  );
  app.use(
    '/agendamentos',
    protegerPorTipo('administrador', 'responsavel'),
    criarAgendamentosRotas(opcoes.agendamentosServico)
  );
  app.use(
    '/eventos',
    protegerPorTipo('administrador', 'responsavel'),
    criarEventosRotas(opcoes.eventosServico)
  );
  app.use(
    '/usuarios',
    protegerPorTipo('administrador'),
    criarUsuariosRotas(opcoes.usuariosServico, {
      incluirCadastroPublico: false,
      incluirGestao: true
    })
  );
  app.use(
    '/pacientes',
    protegerPorTipo('administrador', 'responsavel'),
    criarPacientesRotas(opcoes.pacientesServico)
  );
  app.use(
    '/dispositivos',
    protegerPorTipo('administrador', 'responsavel'),
    criarDispositivosRotas(opcoes.dispositivosServico)
  );
  app.use(
    '/notificacoes',
    protegerPorTipo('administrador', 'responsavel'),
    criarNotificacoesRotas(opcoes.notificacoesServico)
  );

  app.use(tratarErros);

  return app;
}

const app = criarApp();

export default app;
