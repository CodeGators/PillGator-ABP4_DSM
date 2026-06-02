import { router } from 'expo-router';

import { EstadoVazio } from '@/src/componentes/base/EstadoVazio';
import { Tela } from '@/src/componentes/base/Tela';

export function PacienteObrigatorio() {
  return (
    <Tela>
      <EstadoVazio
        titulo="Selecione um paciente"
        mensagem="Escolha ou cadastre um paciente antes de acessar esta area."
        acaoTexto="Ir para pacientes"
        onAcao={() => router.push('/(app)/pacientes')}
      />
    </Tela>
  );
}
