import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { tema } from '@/src/config/tema';

type AvatarPacienteProps = {
  nome: string;
  fotoUrl?: string | null;
  tamanho?: number;
  style?: StyleProp<ViewStyle>;
};

export function AvatarPaciente({
  nome,
  fotoUrl,
  tamanho = 52,
  style,
}: AvatarPacienteProps) {
  const iniciais = obterIniciais(nome);

  return (
    <View
      accessibilityLabel={`Avatar de ${nome}`}
      style={[
        styles.container,
        {
          borderRadius: tamanho / 2,
          height: tamanho,
          width: tamanho,
        },
        style,
      ]}
    >
      {fotoUrl ? (
        <Image
          source={{ uri: fotoUrl }}
          style={{
            borderRadius: tamanho / 2,
            height: tamanho,
            width: tamanho,
          }}
        />
      ) : (
        <Text style={[styles.iniciais, { fontSize: Math.max(14, tamanho * 0.34) }]}>
          {iniciais}
        </Text>
      )}
    </View>
  );
}

export function obterIniciais(nome: string) {
  const partes = nome
    .trim()
    .split(/[\s'-]+/)
    .map((parte) => parte.trim())
    .filter(Boolean);

  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }

  return (partes[0] ?? '?').slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: tema.cores.primariaSuave,
    borderColor: tema.cores.primaria,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iniciais: {
    color: tema.cores.primaria,
    fontWeight: '900',
  },
});
