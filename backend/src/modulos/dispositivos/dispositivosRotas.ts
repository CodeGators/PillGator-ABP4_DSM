import { Router } from 'express';

import { DispositivosControlador } from './dispositivosControlador.js';
import { criarDispositivosServico } from './dispositivosServico.js';
import type { DispositivosServicoContrato } from './dispositivosTipos.js';

export function criarDispositivosRotas(
  servico: DispositivosServicoContrato = criarDispositivosServico()
): Router {
  const rotas = Router();
  const controlador = new DispositivosControlador(servico);

  rotas.get('/', controlador.listar);
  rotas.post('/', controlador.criar);
  rotas.get('/:id/status', controlador.obterStatus);
  rotas.get('/:id', controlador.buscarPorId);
  rotas.put('/:id', controlador.atualizar);
  rotas.delete('/:id', controlador.remover);
  rotas.get('/:dispositivoId/compartimentos', controlador.listarCompartimentos);
  rotas.post('/:dispositivoId/compartimentos', controlador.criarCompartimento);
  rotas.put(
    '/:dispositivoId/compartimentos/:compartimentoId',
    controlador.atualizarCompartimento
  );
  rotas.post(
    '/:dispositivoId/compartimentos/:compartimentoId/liberar',
    controlador.liberarCompartimento
  );
  rotas.post(
    '/:dispositivoId/compartimentos/:compartimentoId/travar',
    controlador.travarCompartimento
  );
  rotas.delete(
    '/:dispositivoId/compartimentos/:compartimentoId',
    controlador.removerCompartimento
  );

  return rotas;
}

export function criarDispositivosIotRotas(
  servico: DispositivosServicoContrato = criarDispositivosServico()
): Router {
  const rotas = Router();
  const controlador = new DispositivosControlador(servico);

  rotas.get(
    '/:identificador/comandos-pendentes',
    controlador.listarComandosPendentes
  );
  rotas.post('/:identificador/eventos', controlador.registrarEventoDispositivo);

  return rotas;
}
