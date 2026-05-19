import { Router } from 'express';

import { AgendamentosControlador } from './agendamentosControlador.js';
import { criarAgendamentosServico } from './agendamentosServico.js';
import type { AgendamentosServicoContrato } from './agendamentosTipos.js';

export function criarAgendamentosRotas(
  servico: AgendamentosServicoContrato = criarAgendamentosServico()
): Router {
  const rotas = Router();
  const controlador = new AgendamentosControlador(servico);

  rotas.get('/', controlador.listar);
  rotas.get(
    '/proximas-administracoes',
    controlador.listarProximasAdministracoes
  );
  rotas.post('/', controlador.criar);
  rotas.get('/:id', controlador.buscarPorId);
  rotas.put('/:id', controlador.atualizar);
  rotas.delete('/:id', controlador.remover);

  return rotas;
}
