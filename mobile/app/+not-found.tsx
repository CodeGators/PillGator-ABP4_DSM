import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/src/componentes/base/Botao';
import { tema } from '@/src/config/tema';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Tela nao encontrada' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Tela nao encontrada</Text>
        <Text style={styles.description}>O caminho acessado nao existe no app PillGator.</Text>

        <Link href="/login" asChild>
          <Botao titulo="Voltar para o inicio" />
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: tema.cores.fundo,
    gap: tema.espacamentos.lg,
    justifyContent: 'center',
    padding: tema.espacamentos.xl,
  },
  title: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.titulo,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    lineHeight: 22,
    textAlign: 'center',
  },
});
