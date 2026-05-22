import { Router } from 'express';

import { NotificacoesControlador } from './notificacoesControlador.js';
import { criarNotificacoesServico } from './notificacoesServico.js';
import type { NotificacoesServicoContrato } from './notificacoesTipos.js';

export function criarNotificacoesRotas(
  servico: NotificacoesServicoContrato = criarNotificacoesServico()
): Router {
  const rotas = Router();
  const controlador = new NotificacoesControlador(servico);

  rotas.get('/', controlador.listar);
  rotas.post('/tokens-push', controlador.registrarTokenPush);
  rotas.post(
    '/processar-proximas',
    controlador.processarProximasNotificacoes
  );
  rotas.post('/verificar-atrasos', controlador.verificarAtrasos);

  return rotas;
}
