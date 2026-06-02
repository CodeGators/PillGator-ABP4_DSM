import { StyleSheet, Text, View } from 'react-native';

import { tema } from '@/src/config/tema';
import { Botao } from './Botao';

type EstadoErroProps = {
  titulo?: string;
  mensagem: string;
  acaoTexto?: string;
  onAcao?: () => void;
};

export function EstadoErro({
  titulo = 'Algo deu errado',
  mensagem,
  acaoTexto,
  onAcao,
}: EstadoErroProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensagem}>{mensagem}</Text>
      {acaoTexto && onAcao ? (
        <Botao titulo={acaoTexto} variante="secundario" onPress={onAcao} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tema.cores.perigoSuave,
    borderColor: tema.cores.perigo,
    borderRadius: tema.raios.lg,
    borderWidth: 1,
    gap: tema.espacamentos.md,
    padding: tema.espacamentos.lg,
  },
  titulo: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.subtitulo,
    fontWeight: '900',
  },
  mensagem: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    lineHeight: 22,
  },
});
