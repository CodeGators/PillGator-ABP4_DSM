let tokenAtual: string | null = null;
let aoExpirarSessao: (() => void) | null = null;

export function obterTokenAtual() {
  return tokenAtual;
}

export function definirTokenAtual(token: string | null) {
  tokenAtual = token;
}

export function definirTratadorSessaoExpirada(tratador: (() => void) | null) {
  aoExpirarSessao = tratador;
}

export function notificarSessaoExpirada() {
  aoExpirarSessao?.();
}
