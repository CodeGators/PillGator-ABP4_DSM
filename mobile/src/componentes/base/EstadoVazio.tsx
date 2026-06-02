import { StyleSheet, Text, View } from 'react-native';

import { tema } from '@/src/config/tema';
import { Botao } from './Botao';

type EstadoVazioProps = {
  titulo: string;
  mensagem: string;
  acaoTexto?: string;
  onAcao?: () => void;
};

export function EstadoVazio({ titulo, mensagem, acaoTexto, onAcao }: EstadoVazioProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensagem}>{mensagem}</Text>
      {acaoTexto && onAcao ? <Botao titulo={acaoTexto} onPress={onAcao} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.lg,
    borderWidth: 1,
    gap: tema.espacamentos.md,
    padding: tema.espacamentos.xxl,
  },
  titulo: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.subtitulo,
    fontWeight: '900',
    textAlign: 'center',
  },
  mensagem: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    lineHeight: 22,
    textAlign: 'center',
  },
});
