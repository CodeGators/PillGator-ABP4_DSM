import { useContext } from 'react';

import { PacienteSelecionadoContexto } from '@/src/contextos/PacienteSelecionadoContexto';

export function usePacienteSelecionado() {
  const contexto = useContext(PacienteSelecionadoContexto);

  if (!contexto) {
    throw new Error(
      'usePacienteSelecionado deve ser usado dentro de PacienteSelecionadoProvider'
    );
  }

  return contexto;
}
