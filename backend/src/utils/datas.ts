import { ErroHttp } from '../erros/ErroHttp.js';

const regexDataIso = /^(\d{4})-(\d{2})-(\d{2})$/;
const regexDataBr = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/;
const regexDataHoraIso = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d{3})?)?(?:Z)?$/;

type OpcoesData = {
  aceitarHora?: boolean;
};

export function normalizarDataParaBanco(
  campo: string,
  valor: unknown,
  opcoes: OpcoesData = {}
): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new ErroHttp(400, mensagemFormato(campo, opcoes.aceitarHora));
  }

  const texto = valor.trim();
  const dataIso = extrairDataIso(texto, opcoes);

  if (!dataIso) {
    throw new ErroHttp(400, mensagemFormato(campo, opcoes.aceitarHora));
  }

  if (!dataIsoValida(dataIso)) {
    throw new ErroHttp(400, `Campo ${campo} deve ser uma data valida`);
  }

  return dataIso;
}

export function formatarDataParaBr(valor?: string | null): string | null {
  if (!valor) {
    return null;
  }

  const texto = String(valor).trim();
  const matchBr = texto.match(regexDataBr);

  if (matchBr) {
    return `${matchBr[1]}/${matchBr[2]}/${matchBr[3]}`;
  }

  const matchIso = texto.match(regexDataIso) ?? texto.match(regexDataHoraIso);

  if (!matchIso) {
    return texto;
  }

  return `${matchIso[3]}/${matchIso[2]}/${matchIso[1]}`;
}

export function formatarDataHoraParaBr(valor: string): string {
  const texto = valor.trim();
  const matchBr = texto.match(regexDataBr);

  if (matchBr?.[4] && matchBr?.[5]) {
    return `${matchBr[1]}/${matchBr[2]}/${matchBr[3]} ${matchBr[4]}:${matchBr[5]}`;
  }

  const matchIso = texto.match(regexDataHoraIso);

  if (!matchIso) {
    return texto;
  }

  return `${matchIso[3]}/${matchIso[2]}/${matchIso[1]} ${matchIso[4]}:${matchIso[5]}`;
}

function extrairDataIso(texto: string, opcoes: OpcoesData): string | null {
  const matchIso = texto.match(regexDataIso);

  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;
  }

  const matchBr = texto.match(regexDataBr);

  if (matchBr) {
    if ((matchBr[4] || matchBr[5]) && !opcoes.aceitarHora) {
      return null;
    }

    if (matchBr[4] && matchBr[5] && !horarioValido(matchBr[4], matchBr[5])) {
      return null;
    }

    return `${matchBr[3]}-${matchBr[2]}-${matchBr[1]}`;
  }

  if (opcoes.aceitarHora) {
    const matchDataHoraIso = texto.match(regexDataHoraIso);

    if (
      matchDataHoraIso?.[4] &&
      matchDataHoraIso?.[5] &&
      horarioValido(matchDataHoraIso[4], matchDataHoraIso[5])
    ) {
      return `${matchDataHoraIso[1]}-${matchDataHoraIso[2]}-${matchDataHoraIso[3]}`;
    }
  }

  return null;
}

function dataIsoValida(dataIso: string): boolean {
  const data = new Date(`${dataIso}T00:00:00.000Z`);

  return !Number.isNaN(data.getTime()) &&
    data.toISOString().slice(0, 10) === dataIso;
}

function horarioValido(hora: string, minuto: string): boolean {
  const horaNumero = Number(hora);
  const minutoNumero = Number(minuto);

  return horaNumero >= 0 &&
    horaNumero <= 23 &&
    minutoNumero >= 0 &&
    minutoNumero <= 59;
}

function mensagemFormato(campo: string, aceitarHora?: boolean): string {
  const formato = aceitarHora ? 'DD/MM/AAAA ou DD/MM/AAAA HH:mm' : 'DD/MM/AAAA';

  return `Campo ${campo} deve estar no formato ${formato}`;
}
