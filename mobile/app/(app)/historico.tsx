import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { EstadoVazio } from '@/src/componentes/base/EstadoVazio';
import { PacienteObrigatorio } from '@/src/componentes/dominio/PacienteObrigatorio';
import { CartaoEvento } from '@/src/componentes/dominio/CartaoEvento';
import { Tela } from '@/src/componentes/base/Tela';
import { tema } from '@/src/config/tema';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { agendamentosServico } from '@/src/servicos/agendamentosServico';
import { eventosServico } from '@/src/servicos/eventosServico';
import { medicamentosServico } from '@/src/servicos/medicamentosServico';
import type { Agendamento } from '@/src/tipos/agendamento';
import type { ErroApi } from '@/src/tipos/api';
import type { Evento } from '@/src/tipos/evento';
import type { Medicamento } from '@/src/tipos/medicamento';

export default function HistoricoScreen() {
  const { pacienteSelecionado } = usePacienteSelecionado();
  const [medicamentoFiltroId, setMedicamentoFiltroId] = useState<string | null>(null);
  const [agendamentoFiltroId, setAgendamentoFiltroId] = useState<string | null>(null);

  const pacienteId = pacienteSelecionado?.id;

  const medicamentosQuery = useQuery({
    queryKey: ['medicamentos', pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: () => medicamentosServico.listar(pacienteId),
  });

  const agendamentosQuery = useQuery({
    queryKey: ['agendamentos', pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: () => agendamentosServico.listar({ pacienteId }),
  });

  const medicamentos = medicamentosQuery.data ?? [];
  const agendamentos = agendamentosQuery.data ?? [];

  const medicamentosPorId = useMemo(
    () => new Map(medicamentos.map((medicamento) => [medicamento.id, medicamento])),
    [medicamentos]
  );

  const eventosQuery = useQuery({
    queryKey: [
      'eventos',
      pacienteId,
      medicamentoFiltroId,
      agendamentoFiltroId,
      medicamentos.map((medicamento) => medicamento.id).join(','),
    ],
    enabled:
      Boolean(pacienteId) &&
      medicamentosQuery.isSuccess &&
      agendamentosQuery.isSuccess,
    queryFn: async () => {
      if (agendamentoFiltroId) {
        return eventosServico.listar({ agendamentoId: agendamentoFiltroId });
      }

      if (medicamentoFiltroId) {
        return eventosServico.listar({ medicamentoId: medicamentoFiltroId });
      }

      if (medicamentos.length === 0) {
        return [];
      }

      const listas = await Promise.all(
        medicamentos.map((medicamento) =>
          eventosServico.listar({ medicamentoId: medicamento.id })
        )
      );

      return ordenarEventos(removerEventosDuplicados(listas.flat()));
    },
  });

  if (!pacienteSelecionado) {
    return <PacienteObrigatorio />;
  }

  function limparFiltros() {
    setMedicamentoFiltroId(null);
    setAgendamentoFiltroId(null);
  }

  function selecionarMedicamento(medicamentoId: string) {
    setMedicamentoFiltroId(medicamentoId);
    setAgendamentoFiltroId(null);
  }

  function selecionarAgendamento(agendamentoId: string) {
    setAgendamentoFiltroId(agendamentoId);
    setMedicamentoFiltroId(null);
  }

  const eventos = eventosQuery.data ?? [];

  return (
    <Tela>
      <CabecalhoTela
        titulo="Historico"
        subtitulo={`Consulte retiradas, alertas, atrasos e alteracoes de ${pacienteSelecionado.nome}.`}
      />

      <View style={styles.filtros}>
        <Text style={styles.label}>Medicamentos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosLinha}
        >
          <FiltroPill
            label="Todos"
            selecionado={!medicamentoFiltroId && !agendamentoFiltroId}
            onPress={limparFiltros}
          />
          {medicamentos.map((medicamento) => (
            <FiltroPill
              key={medicamento.id}
              label={medicamento.nome}
              selecionado={medicamentoFiltroId === medicamento.id}
              onPress={() => selecionarMedicamento(medicamento.id)}
            />
          ))}
        </ScrollView>

        {agendamentos.length > 0 ? (
          <>
            <Text style={styles.label}>Agendamentos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtrosLinha}
            >
              {agendamentos.map((agendamento) => (
                <FiltroPill
                  key={agendamento.id}
                  label={descreverAgendamento(agendamento, medicamentosPorId)}
                  selecionado={agendamentoFiltroId === agendamento.id}
                  onPress={() => selecionarAgendamento(agendamento.id)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}
      </View>

      {medicamentosQuery.isLoading || agendamentosQuery.isLoading || eventosQuery.isLoading ? (
        <EstadoCarregando mensagem="Carregando historico..." />
      ) : null}

      {medicamentosQuery.isError || agendamentosQuery.isError || eventosQuery.isError ? (
        <EstadoErro
          mensagem={
            ((eventosQuery.error ??
              medicamentosQuery.error ??
              agendamentosQuery.error) as unknown as ErroApi)?.mensagem ??
            'Nao foi possivel carregar o historico.'
          }
          acaoTexto="Tentar novamente"
          onAcao={() => {
            medicamentosQuery.refetch();
            agendamentosQuery.refetch();
            eventosQuery.refetch();
          }}
        />
      ) : null}

      {eventosQuery.isSuccess && eventos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum evento encontrado"
          mensagem={
            medicamentos.length === 0
              ? 'Cadastre medicamentos para acompanhar o historico deste paciente.'
              : 'Ainda nao ha retiradas, alertas, atrasos ou falhas registrados para este filtro.'
          }
        />
      ) : null}

      {eventos.map((evento) => (
        <CartaoEvento
          key={evento.id}
          evento={evento}
          medicamento={obterMedicamentoEvento(evento, medicamentosPorId)}
        />
      ))}
    </Tela>
  );
}

type FiltroPillProps = {
  label: string;
  selecionado: boolean;
  onPress: () => void;
};

function FiltroPill({ label, selecionado, onPress }: FiltroPillProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.pill, selecionado && styles.pillSelecionado]}
    >
      <Text style={[styles.pillTexto, selecionado && styles.pillTextoSelecionado]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function obterMedicamentoEvento(
  evento: Evento,
  medicamentosPorId: Map<string, Medicamento>
) {
  return evento.medicamentoId
    ? medicamentosPorId.get(evento.medicamentoId) ?? null
    : null;
}

function descreverAgendamento(
  agendamento: Agendamento,
  medicamentosPorId: Map<string, Medicamento>
) {
  const medicamento = medicamentosPorId.get(agendamento.medicamentoId);
  const nome = medicamento?.nome ?? agendamento.medicamento?.nome ?? 'Medicamento';

  if (agendamento.tipo === 'horarios_fixos') {
    return `${nome}: ${agendamento.horarios?.join(', ') ?? '-'}`;
  }

  return `${nome}: ${agendamento.intervaloHoras}h`;
}

function removerEventosDuplicados(eventos: Evento[]) {
  const eventosPorId = new Map<string, Evento>();

  for (const evento of eventos) {
    eventosPorId.set(evento.id, evento);
  }

  return [...eventosPorId.values()];
}

function ordenarEventos(eventos: Evento[]) {
  return [...eventos].sort((atual, proximo) => {
    const dataAtual = new Date(atual.ocorridoEm).getTime();
    const dataProximo = new Date(proximo.ocorridoEm).getTime();

    return dataProximo - dataAtual;
  });
}

const styles = StyleSheet.create({
  filtros: {
    gap: tema.espacamentos.sm,
  },
  filtrosLinha: {
    gap: tema.espacamentos.sm,
    paddingBottom: tema.espacamentos.xs,
  },
  label: {
    color: tema.cores.primaria,
    fontSize: tema.tipografia.apoio,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pill: {
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    paddingHorizontal: tema.espacamentos.md,
    paddingVertical: tema.espacamentos.sm,
  },
  pillSelecionado: {
    backgroundColor: tema.cores.primariaSuave,
    borderColor: tema.cores.primaria,
  },
  pillTexto: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.apoio,
    fontWeight: '900',
  },
  pillTextoSelecionado: {
    color: tema.cores.primaria,
  },
});
