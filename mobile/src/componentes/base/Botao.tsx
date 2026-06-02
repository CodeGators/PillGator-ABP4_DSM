import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native';

import { tema } from '@/src/config/tema';

type BotaoProps = PropsWithChildren<TouchableOpacityProps> & {
  titulo?: string;
  variante?: 'primario' | 'secundario' | 'perigo' | 'fantasma';
  carregando?: boolean;
};

export function Botao({
  children,
  titulo,
  variante = 'primario',
  carregando = false,
  disabled,
  style,
  ...props
}: BotaoProps) {
  const desabilitado = disabled || carregando;
  const rotuloAcessivel = props.accessibilityLabel ?? titulo;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityLabel={rotuloAcessivel}
      accessibilityRole="button"
      accessibilityState={{ busy: carregando, disabled: desabilitado }}
      disabled={desabilitado}
      hitSlop={8}
      style={[styles.base, styles[variante], desabilitado && styles.desabilitado, style]}
      {...props}
    >
      {carregando ? (
        <ActivityIndicator color={variante === 'primario' ? tema.cores.preto : tema.cores.texto} />
      ) : (
        children ?? (
          <Text style={[styles.texto, styles[`texto_${variante}`]]}>{titulo}</Text>
        )
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: tema.raios.md,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: tema.espacamentos.lg,
    paddingVertical: tema.espacamentos.md,
  },
  primario: {
    backgroundColor: tema.cores.primaria,
  },
  secundario: {
    backgroundColor: tema.cores.superficieAlta,
    borderColor: tema.cores.bordaForte,
    borderWidth: 1,
  },
  perigo: {
    backgroundColor: tema.cores.perigoSuave,
    borderColor: tema.cores.perigo,
    borderWidth: 1,
  },
  fantasma: {
    backgroundColor: 'transparent',
  },
  desabilitado: {
    opacity: 0.55,
  },
  texto: {
    fontSize: tema.tipografia.corpo,
    fontWeight: '900',
    textAlign: 'center',
  },
  texto_primario: {
    color: tema.cores.preto,
  },
  texto_secundario: {
    color: tema.cores.texto,
  },
  texto_perigo: {
    color: tema.cores.perigo,
  },
  texto_fantasma: {
    color: tema.cores.primaria,
  },
});
