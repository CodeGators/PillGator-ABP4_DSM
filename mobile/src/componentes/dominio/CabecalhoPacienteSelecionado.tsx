import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tema } from '@/src/config/tema';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { AvatarPaciente } from './AvatarPaciente';

export function CabecalhoPacienteSelecionado() {
  const { pacienteSelecionado } = usePacienteSelecionado();
  const nomePaciente = pacienteSelecionado?.nome ?? 'Nenhum paciente selecionado';
  const detalhePaciente = pacienteSelecionado?.dataNascimento
    ? `Nascimento: ${pacienteSelecionado.dataNascimento}`
    : 'Toque para escolher um paciente';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <TouchableOpacity
        activeOpacity={0.84}
        accessibilityHint="Abre a lista de pacientes"
        accessibilityLabel={`Paciente selecionado: ${nomePaciente}`}
        accessibilityRole="button"
        onPress={() => router.push('/(app)/pacientes')}
        style={styles.container}
      >
        {pacienteSelecionado ? (
          <AvatarPaciente
            fotoUrl={pacienteSelecionado.fotoUrl}
            nome={pacienteSelecionado.nome}
            tamanho={44}
          />
        ) : (
          <View style={styles.avatar}>
            <FontAwesome color={tema.cores.textoFraco} name="user" size={16} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.rotulo}>Paciente selecionado</Text>
          <Text numberOfLines={1} style={styles.nome}>
            {nomePaciente}
          </Text>
          <Text numberOfLines={1} style={styles.detalhe}>
            {detalhePaciente}
          </Text>
        </View>
        <FontAwesome color={tema.cores.textoFraco} name="chevron-right" size={14} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: tema.cores.fundo,
    borderBottomColor: tema.cores.bordaForte,
    borderBottomWidth: 1,
  },
  container: {
    alignItems: 'center',
    backgroundColor: tema.cores.fundo,
    flexDirection: 'row',
    gap: tema.espacamentos.md,
    minHeight: 74,
    paddingHorizontal: tema.espacamentos.xl,
    paddingVertical: tema.espacamentos.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.bordaForte,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  rotulo: {
    color: tema.cores.primaria,
    fontSize: tema.tipografia.apoio,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  nome: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.corpo,
    fontWeight: '900',
    marginTop: 2,
  },
  detalhe: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    marginTop: 2,
  },
});
