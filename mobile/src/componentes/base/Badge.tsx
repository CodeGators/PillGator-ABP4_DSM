import { StyleSheet, Text, View } from 'react-native';

import { tema } from '@/src/config/tema';

type BadgeProps = {
  texto: string;
  variante?: 'neutro' | 'sucesso' | 'alerta' | 'perigo' | 'info';
};

const variantes = {
  neutro: {
    borda: tema.cores.bordaForte,
    fundo: tema.cores.superficieAlta,
    texto: tema.cores.textoSecundario,
  },
  sucesso: {
    borda: tema.cores.primaria,
    fundo: tema.cores.primariaSuave,
    texto: tema.cores.primaria,
  },
  alerta: {
    borda: tema.cores.alerta,
    fundo: tema.cores.alertaSuave,
    texto: tema.cores.alerta,
  },
  perigo: {
    borda: tema.cores.perigo,
    fundo: tema.cores.perigoSuave,
    texto: tema.cores.perigo,
  },
  info: {
    borda: tema.cores.info,
    fundo: tema.cores.infoSuave,
    texto: tema.cores.info,
  },
};

export function Badge({ texto, variante = 'neutro' }: BadgeProps) {
  const estilo = variantes[variante];

  return (
    <View
      accessibilityLabel={texto}
      style={[
        styles.badge,
        { backgroundColor: estilo.fundo, borderColor: estilo.borda },
      ]}
    >
      <Text style={[styles.texto, { color: estilo.texto }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: tema.raios.sm,
    minHeight: 32,
    paddingHorizontal: tema.espacamentos.md,
    paddingVertical: 6,
  },
  texto: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
