import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { tema } from '@/src/config/tema';

type CampoTextoProps = TextInputProps & {
  label: string;
  erro?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function CampoTexto({ label, erro, style, containerStyle, ...props }: CampoTextoProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityHint={props.accessibilityHint ?? erro}
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={tema.cores.textoFraco}
        style={[styles.input, erro && styles.inputErro, style]}
        {...props}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tema.espacamentos.sm,
  },
  label: {
    color: tema.cores.primaria,
    fontSize: tema.tipografia.apoio,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    color: tema.cores.texto,
    fontSize: tema.tipografia.corpo,
    minHeight: 54,
    paddingHorizontal: tema.espacamentos.lg,
  },
  inputErro: {
    borderColor: tema.cores.perigo,
  },
  erro: {
    color: tema.cores.perigo,
    fontSize: tema.tipografia.corpo,
  },
});
