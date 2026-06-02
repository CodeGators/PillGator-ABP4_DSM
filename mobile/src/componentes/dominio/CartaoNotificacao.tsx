import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/src/componentes/base/Badge';
import { Cartao } from '@/src/componentes/base/Cartao';
import { tema } from '@/src/config/tema';
import type { Notificacao, TipoNotificacao } from '@/src/tipos/notificacao';

type CartaoNotificacaoProps = {
  notificacao: Notificacao;
};

const nomesTipo: Record<TipoNotificacao, string> = {
  antes_horario_medicamento: 'proxima dose',
  horario_medicamento: 'hora do remedio',
  atraso_medicamento: 'atraso',
};

export function CartaoNotificacao({ notificacao }: CartaoNotificacaoProps) {
  const variante = obterVarianteNotificacao(notificacao);

  return (
    <Cartao destaque={variante}>
      <View style={styles.linha}>
        <View style={styles.info}>
          <Text style={styles.titulo}>{notificacao.titulo}</Text>
          <Text style={styles.data}>
            {formatarDataHora(notificacao.enviadaEm ?? notificacao.criadoEm)}
          </Text>
        </View>
        <Badge texto={nomesTipo[notificacao.tipo]} variante={variante} />
      </View>

      <Text style={styles.texto}>{notificacao.mensagem}</Text>

      <View style={styles.metadados}>
        <Badge texto={notificacao.status} variante={notificacao.status === 'erro' ? 'perigo' : 'neutro'} />
        <Badge texto={notificacao.canal} variante="info" />
        {obterHorarioPrevisto(notificacao) ? (
          <Badge texto={obterHorarioPrevisto(notificacao)!} variante="neutro" />
        ) : null}
      </View>
    </Cartao>
  );
}

function obterVarianteNotificacao(notificacao: Notificacao) {
  if (notificacao.status === 'erro' || notificacao.tipo === 'atraso_medicamento') {
    return 'perigo' as const;
  }

  if (notificacao.tipo === 'horario_medicamento') {
    return 'alerta' as const;
  }

  return 'info' as const;
}

function obterHorarioPrevisto(notificacao: Notificacao) {
  const valor = notificacao.dados?.horarioPrevisto;

  if (typeof valor !== 'string') {
    return null;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data);
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
    flex: 1,
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
