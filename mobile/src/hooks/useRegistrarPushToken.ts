import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAutenticacao } from '@/src/hooks/useAutenticacao';
import { notificacoesServico } from '@/src/servicos/notificacoesServico';
import type { PlataformaPush } from '@/src/tipos/notificacao';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export function useRegistrarPushToken() {
  const router = useRouter();
  const { token, usuario } = useAutenticacao();
  const [erroPush, setErroPush] = useState<string | null>(null);
  const usuarioId = usuario?.id;

  useEffect(() => {
    if (!token || !usuarioId || Platform.OS === 'web') {
      return;
    }

    let ativo = true;

    async function registrarToken() {
      try {
        const permissaoAtual = await Notifications.getPermissionsAsync();
        let statusFinal = permissaoAtual.status;

        if (statusFinal !== 'granted') {
          const permissaoSolicitada = await Notifications.requestPermissionsAsync();
          statusFinal = permissaoSolicitada.status;
        }

        if (statusFinal !== 'granted') {
          setErroPush('Permissao de notificacao nao concedida.');
          return;
        }

        const projectId = obterProjectId();
        const tokenExpo = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );

        if (!ativo) {
          return;
        }

        await notificacoesServico.registrarTokenPush({
          responsavelId: usuarioId,
          token: tokenExpo.data,
          plataforma: obterPlataforma(),
          dispositivoNome: Constants.deviceName ?? `PillGator ${Platform.OS}`,
        });

        if (ativo) {
          setErroPush(null);
        }
      } catch (erro) {
        if (ativo) {
          setErroPush(
            erro instanceof Error
              ? erro.message
              : 'Nao foi possivel registrar notificacoes push.'
          );
        }
      }
    }

    void registrarToken();

    return () => {
      ativo = false;
    };
  }, [token, usuarioId]);

  useEffect(() => {
    if (!token || Platform.OS === 'web') {
      return;
    }

    const assinatura = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/alertas');
    });

    const ultimaResposta = Notifications.getLastNotificationResponse();

    if (ultimaResposta) {
      router.push('/alertas');
    }

    return () => {
      assinatura.remove();
    };
  }, [router, token]);

  return { erroPush };
}

function obterProjectId() {
  return Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    undefined;
}

function obterPlataforma(): PlataformaPush {
  if (Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web') {
    return Platform.OS;
  }

  return 'desconhecida';
}
