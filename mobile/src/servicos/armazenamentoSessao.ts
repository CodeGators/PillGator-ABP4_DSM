import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { LoginResposta } from '@/src/tipos/autenticacao';

const CHAVE_SESSAO = 'pillgator.sessao';

export async function salvarSessao(sessao: LoginResposta) {
  if (Platform.OS === 'web') {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    return;
  }

  await SecureStore.setItemAsync(CHAVE_SESSAO, JSON.stringify(sessao));
}

export async function carregarSessao() {
  const valor =
    Platform.OS === 'web'
      ? localStorage.getItem(CHAVE_SESSAO)
      : await SecureStore.getItemAsync(CHAVE_SESSAO);

  if (!valor) {
    return null;
  }

  try {
    return JSON.parse(valor) as LoginResposta;
  } catch {
    await limparSessao();
    return null;
  }
}

export async function limparSessao() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(CHAVE_SESSAO);
    return;
  }

  await SecureStore.deleteItemAsync(CHAVE_SESSAO);
}
