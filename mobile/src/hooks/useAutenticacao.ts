import { useContext } from 'react';

import { AutenticacaoContexto } from '@/src/contextos/AutenticacaoContexto';

export function useAutenticacao() {
  const contexto = useContext(AutenticacaoContexto);

  if (!contexto) {
    throw new Error('useAutenticacao deve ser usado dentro de AutenticacaoProvider');
  }

  return contexto;
}
