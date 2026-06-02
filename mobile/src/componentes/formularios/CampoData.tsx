import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { tema } from '@/src/config/tema';

type CampoDataProps = {
  label: string;
  value: string;
  onChangeText: (valor: string) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  opcional?: boolean;
};

export function CampoData({
  label,
  value,
  onChangeText,
  placeholder = 'DD/MM/AAAA',
  containerStyle,
  opcional = false,
}: CampoDataProps) {
  const [aberto, setAberto] = useState(false);

  function alterarData(evento: DateTimePickerEvent, dataSelecionada?: Date) {
    if (Platform.OS === 'android') {
      setAberto(false);
    }

    if (evento.type === 'dismissed') {
      return;
    }

    if (dataSelecionada) {
      onChangeText(formatarDataBr(dataSelecionada));

      if (Platform.OS === 'ios') {
        setAberto(false);
      }
    }
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.82}
        accessibilityHint="Abre o seletor de data do celular"
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        hitSlop={4}
        onPress={() => setAberto(true)}
        style={styles.campo}
      >
        <Text style={[styles.valor, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      {opcional && value ? (
        <TouchableOpacity
          activeOpacity={0.82}
          accessibilityLabel={`Limpar ${label}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText('')}
        >
          <Text style={styles.limpar}>Limpar data</Text>
        </TouchableOpacity>
      ) : null}

      {aberto ? (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          mode="date"
          onChange={alterarData}
          value={converterDataBrParaDate(value) ?? new Date()}
        />
      ) : null}
    </View>
  );
}

function converterDataBrParaDate(valor: string) {
  const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, dia, mes, ano] = match;

  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

function formatarDataBr(data: Date) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
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
  campo: {
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: tema.espacamentos.lg,
  },
  valor: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.corpo,
  },
  placeholder: {
    color: tema.cores.textoSecundario,
  },
  limpar: {
    color: tema.cores.info,
    fontSize: tema.tipografia.corpo,
    fontWeight: '800',
  },
});
