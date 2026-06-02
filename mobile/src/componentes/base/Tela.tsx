import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tema } from '@/src/config/tema';

type TelaProps = PropsWithChildren<ScrollViewProps> & {
  semScroll?: boolean;
};

export function Tela({ children, semScroll = false, contentContainerStyle, ...props }: TelaProps) {
  if (semScroll) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.conteudoFixo}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.conteudo, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: tema.cores.fundo,
    flex: 1,
  },
  conteudo: {
    gap: tema.espacamentos.lg,
    padding: tema.espacamentos.xl,
    paddingBottom: 144,
  },
  conteudoFixo: {
    flex: 1,
    padding: tema.espacamentos.xl,
  },
});
