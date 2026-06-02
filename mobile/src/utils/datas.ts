export function formatarDataDigitada(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);

  if (digitos.length <= 2) {
    return digitos;
  }

  if (digitos.length <= 4) {
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }

  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export function converterDataBrParaApi(valor: string) {
  if (!valor.trim()) {
    return null;
  }

  const partes = valor.split('/');

  if (partes.length !== 3) {
    return null;
  }

  const [dia, mes, ano] = partes;

  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) {
    return null;
  }

  const dataApi = `${ano}-${mes}-${dia}`;
  const data = new Date(`${dataApi}T00:00:00.000Z`);

  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== dataApi) {
    return null;
  }

  return dataApi;
}

export function dataBrValida(valor: string) {
  return converterDataBrParaApi(valor) !== null;
}

export function formatarDataApiParaBr(valor?: string | null) {
  if (!valor) {
    return '';
  }

  if (/^\d{2}\/\d{2}\/\d{4}/.test(valor)) {
    return valor.slice(0, 10);
  }

  const [ano, mes, dia] = valor.slice(0, 10).split('-');

  if (!ano || !mes || !dia) {
    return valor;
  }

  return `${dia}/${mes}/${ano}`;
}
