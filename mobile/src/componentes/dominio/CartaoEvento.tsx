import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/src/componentes/base/Badge';
import { Cartao } from '@/src/componentes/base/Cartao';
import { tema } from '@/src/config/tema';
import type { Evento, TipoEvento } from '@/src/tipos/evento';
import type { Medicamento } from '@/src/tipos/medicamento';

type CartaoEventoProps = {
  evento: Evento;
  medicamento?: Medicamento | null;
};

const titulosEvento: Record<TipoEvento, string> = {
  alerta_emitido: 'Alerta emitido',
  compartimento_aberto: 'Compartimento aberto',
  compartimento_fechado: 'Compartimento fechado',
  medicamento_retirado: 'Medicamento retirado',
  dose_perdida: 'Dose perdida',
  atraso: 'Atraso',
  falha: 'Falha',
};

export function CartaoEvento({ evento, medicamento }: CartaoEventoProps) {
  const variante = obterVarianteEvento(evento.tipo);
  const dataHora = formatarDataHora(evento.ocorridoEm);

  return (
    <Cartao destaque={variante}>
      <View style={styles.linha}>
        <View style={styles.info}>
          <Text style={styles.titulo}>{titulosEvento[evento.tipo] ?? evento.tipo}</Text>
          <Text style={styles.data}>{dataHora}</Text>
        </View>
        <Badge texto={evento.origem} variante={variante} />
      </View>

      <Text style={styles.texto}>
        {evento.descricao ?? descreverEvento(evento, medicamento)}
      </Text>

      <View style={styles.metadados}>
        {medicamento ? (
          <Badge texto={medicamento.nome} variante="neutro" />
        ) : null}
        {obterCompartimento(evento) ? (
          <Badge texto={`gaveta ${obterCompartimento(evento)}`} variante="info" />
        ) : null}
        {evento.dispositivoId ? (
          <Badge texto={evento.dispositivoId} variante="neutro" />
        ) : null}
      </View>
    </Cartao>
  );
}

function descreverEvento(evento: Evento, medicamento?: Medicamento | null) {
  const nomeMedicamento = medicamento?.nome ?? 'Medicamento';

  if (evento.tipo === 'medicamento_retirado') {
    return `${nomeMedicamento} retirado.`;
  }

  if (evento.tipo === 'alerta_emitido') {
    return `Alerta emitido para ${nomeMedicamento}.`;
  }

  if (evento.tipo === 'atraso') {
    return `${nomeMedicamento} esta atrasado.`;
  }

  if (evento.tipo === 'dose_perdida') {
    return `${nomeMedicamento} nao foi retirado no tempo esperado.`;
  }

  if (evento.tipo === 'falha') {
    return 'Falha registrada no tratamento ou dispositivo.';
  }

  if (evento.tipo === 'compartimento_aberto') {
    return 'Compartimento aberto.';
  }

  if (evento.tipo === 'compartimento_fechado') {
    return 'Compartimento fechado.';
  }

  return 'Evento registrado no historico.';
}

function obterVarianteEvento(tipo: TipoEvento) {
  if (tipo === 'medicamento_retirado' || tipo === 'compartimento_fechado') {
    return 'sucesso' as const;
  }

  if (tipo === 'alerta_emitido' || tipo === 'compartimento_aberto') {
    return 'info' as const;
  }

  if (tipo === 'atraso') {
    return 'alerta' as const;
  }

  return 'perigo' as const;
}

function obterCompartimento(evento: Evento) {
  const valor =
    evento.dados?.compartimento ??
    evento.dados?.compartimentoNumero ??
    evento.dados?.numeroCompartimento;

  if (typeof valor === 'string' || typeof valor === 'number') {
    return String(valor);
  }

  return null;
}

function formatarDataHora(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data);
}

const styles = StyleSheet.create({
  linha: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: tema.espacamentos.md,
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  titulo: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.subtitulo,
    fontWeight: '900',
  },
  data: {
    color: tema.cores.primaria,
    fontSize: tema.tipografia.apoio,
    fontWeight: '800',
    marginTop: tema.espacamentos.xs,
  },
  texto: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    lineHeight: 23,
    marginTop: tema.espacamentos.md,
  },
  metadados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tema.espacamentos.sm,
    marginTop: tema.espacamentos.md,
  },
});
