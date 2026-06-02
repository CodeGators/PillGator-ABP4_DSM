import { type StyleProp, type ViewStyle } from 'react-native';

import { CampoTexto } from '@/src/componentes/base/CampoTexto';

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
}: CampoDataProps) {
  return (
    <CampoTexto
      containerStyle={containerStyle}
      keyboardType="number-pad"
      label={label}
      onChangeText={(valor) => onChangeText(formatarDataDigitada(valor))}
      placeholder={placeholder}
      value={value}
    />
  );
}

function formatarDataDigitada(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);

  if (digitos.length <= 2) {
    return digitos;
  }

  if (digitos.length <= 4) {
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }

  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}
