import { Redirect } from 'expo-router';

import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { Tela } from '@/src/componentes/base/Tela';
import { useAutenticacao } from '@/src/hooks/useAutenticacao';

export default function Index() {
  const { carregandoSessao, token } = useAutenticacao();

  if (carregandoSessao) {
    return (
      <Tela semScroll>
        <EstadoCarregando mensagem="Carregando sessao..." />
      </Tela>
    );
  }

  return <Redirect href={token ? '/(app)/inicio' : '/login'} />;
}
