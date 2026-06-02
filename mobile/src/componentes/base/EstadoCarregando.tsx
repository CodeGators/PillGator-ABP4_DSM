import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { tema } from '@/src/config/tema';

type EstadoCarregandoProps = {
  mensagem?: string;
};

export function EstadoCarregando({ mensagem = 'Carregando informacoes...' }: EstadoCarregandoProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={tema.cores.primaria} size="large" />
      <Text style={styles.texto}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: tema.espacamentos.md,
    padding: tema.espacamentos.xxl,
  },
  texto: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    textAlign: 'center',
  },
});
