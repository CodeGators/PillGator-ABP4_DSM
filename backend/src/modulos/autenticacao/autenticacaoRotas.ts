import { Router } from 'express';

import { autenticar } from '../../middlewares/autenticacao.js';
import { AutenticacaoControlador } from './autenticacaoControlador.js';
import { criarAutenticacaoServico } from './autenticacaoServico.js';
import type { AutenticacaoServicoContrato } from './autenticacaoTipos.js';

export function criarAutenticacaoRotas(
  servico: AutenticacaoServicoContrato = criarAutenticacaoServico()
): Router {
  const rotas = Router();
  const controlador = new AutenticacaoControlador(servico);

  rotas.post('/login', controlador.login);
  rotas.post('/recuperar-senha', controlador.solicitarRecuperacaoSenha);
  rotas.post('/redefinir-senha', controlador.redefinirSenha);
  rotas.get('/me', autenticar, controlador.me);

  return rotas;
}
