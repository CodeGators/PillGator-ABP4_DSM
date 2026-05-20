import { Router } from 'express';

import { BaseMedicamentosControlador } from './baseMedicamentosControlador.js';
import { criarBaseMedicamentosServico } from './baseMedicamentosServico.js';
import type { BaseMedicamentosServicoContrato } from './baseMedicamentosTipos.js';

export function criarBaseMedicamentosRotas(
  servico: BaseMedicamentosServicoContrato = criarBaseMedicamentosServico()
): Router {
  const rotas = Router();
  const controlador = new BaseMedicamentosControlador(servico);

  rotas.get('/', controlador.listar);
  rotas.get('/:id', controlador.buscarPorId);

  return rotas;
}
