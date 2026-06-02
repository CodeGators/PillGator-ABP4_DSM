import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tema } from '@/src/config/tema';

type CabecalhoTelaProps = {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
};

export function CabecalhoTela({ titulo, subtitulo, acao }: CabecalhoTelaProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textos}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
      {acao}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tema.espacamentos.md,
    justifyContent: 'space-between',
  },
  textos: {
    flex: 1,
    gap: tema.espacamentos.sm,
  },
  titulo: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.titulo,
    fontWeight: '900',
  },
  subtitulo: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    lineHeight: 22,
  },
});
