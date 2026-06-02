import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PREFIXO_CHAVE_PACIENTE = 'pillgator.pacienteSelecionado';

function obterChave(usuarioId: string) {
  return `${PREFIXO_CHAVE_PACIENTE}.${usuarioId}`;
}

export async function salvarPacienteSelecionadoId(usuarioId: string, pacienteId: string) {
  const chave = obterChave(usuarioId);

  if (Platform.OS === 'web') {
    localStorage.setItem(chave, pacienteId);
    return;
  }

  await SecureStore.setItemAsync(chave, pacienteId);
}

export async function carregarPacienteSelecionadoId(usuarioId: string) {
  const chave = obterChave(usuarioId);

  return Platform.OS === 'web'
    ? localStorage.getItem(chave)
    : SecureStore.getItemAsync(chave);
}

export async function limparPacienteSelecionadoId(usuarioId: string) {
  const chave = obterChave(usuarioId);

  if (Platform.OS === 'web') {
    localStorage.removeItem(chave);
    return;
  }

  await SecureStore.deleteItemAsync(chave);
}
