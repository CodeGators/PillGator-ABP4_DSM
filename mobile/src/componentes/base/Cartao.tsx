import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { tema } from '@/src/config/tema';

type CartaoProps = PropsWithChildren<ViewProps> & {
  destaque?: 'padrao' | 'sucesso' | 'alerta' | 'perigo' | 'info';
};

const coresDestaque = {
  padrao: tema.cores.borda,
  sucesso: tema.cores.primaria,
  alerta: tema.cores.alerta,
  perigo: tema.cores.perigo,
  info: tema.cores.info,
};

export function Cartao({ children, destaque = 'padrao', style, ...props }: CartaoProps) {
  return (
    <View
      style={[styles.cartao, { borderLeftColor: coresDestaque[destaque] }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderLeftWidth: 4,
    borderRadius: tema.raios.lg,
    borderWidth: 1,
    padding: tema.espacamentos.lg,
  },
});
