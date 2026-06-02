import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { tema } from '@/src/config/tema';

type SeletorDiasSemanaProps = {
  diasSelecionados: number[];
  onChange: (dias: number[]) => void;
};

const diasSemana = [
  { valor: 0, rotulo: 'D', nome: 'domingo' },
  { valor: 1, rotulo: 'S', nome: 'segunda-feira' },
  { valor: 2, rotulo: 'T', nome: 'terca-feira' },
  { valor: 3, rotulo: 'Q', nome: 'quarta-feira' },
  { valor: 4, rotulo: 'Q', nome: 'quinta-feira' },
  { valor: 5, rotulo: 'S', nome: 'sexta-feira' },
  { valor: 6, rotulo: 'S', nome: 'sabado' },
];

export function SeletorDiasSemana({
  diasSelecionados,
  onChange,
}: SeletorDiasSemanaProps) {
  function alternarDia(dia: number) {
    const selecionado = diasSelecionados.includes(dia);
    const proximosDias = selecionado
      ? diasSelecionados.filter((item) => item !== dia)
      : [...diasSelecionados, dia];

    onChange(proximosDias.sort((atual, proximo) => atual - proximo));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dias da semana</Text>
      <View style={styles.dias}>
        {diasSemana.map((dia) => {
          const selecionado = diasSelecionados.includes(dia.valor);

          return (
            <TouchableOpacity
              activeOpacity={0.82}
              accessibilityLabel={`${dia.nome}${selecionado ? ', selecionado' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: selecionado }}
              hitSlop={4}
              key={`${dia.valor}-${dia.rotulo}`}
              onPress={() => alternarDia(dia.valor)}
              style={[styles.dia, selecionado && styles.diaSelecionado]}
            >
              <Text style={[styles.diaTexto, selecionado && styles.diaTextoSelecionado]}>
                {dia.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  dias: {
    flexDirection: 'row',
    gap: tema.espacamentos.sm,
  },
  dia: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  diaSelecionado: {
    backgroundColor: tema.cores.primaria,
    borderColor: tema.cores.primaria,
  },
  diaTexto: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    fontWeight: '900',
  },
  diaTextoSelecionado: {
    color: tema.cores.preto,
  },
});
