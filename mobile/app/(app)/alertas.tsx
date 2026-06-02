import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Botao } from '@/src/componentes/base/Botao';
import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { EstadoVazio } from '@/src/componentes/base/EstadoVazio';
import { PacienteObrigatorio } from '@/src/componentes/dominio/PacienteObrigatorio';
import { CartaoNotificacao } from '@/src/componentes/dominio/CartaoNotificacao';
import { Tela } from '@/src/componentes/base/Tela';
import { tema } from '@/src/config/tema';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { notificacoesServico } from '@/src/servicos/notificacoesServico';
import type { ErroApi } from '@/src/tipos/api';
import type { StatusNotificacao } from '@/src/tipos/notificacao';
import { useState } from 'react';

const filtrosStatus: Array<{ label: string; status: StatusNotificacao | null }> = [
  { label: 'Todas', status: null },
  { label: 'Pendentes', status: 'pendente' },
  { label: 'Enviadas', status: 'enviada' },
  { label: 'Erro', status: 'erro' },
];

export default function AlertasScreen() {
  const { pacienteSelecionado } = usePacienteSelecionado();
  const [statusFiltro, setStatusFiltro] = useState<StatusNotificacao | null>(null);

  const pacienteId = pacienteSelecionado?.id;

  const notificacoesQuery = useQuery({
    queryKey: ['notificacoes', pacienteId, statusFiltro],
    enabled: Boolean(pacienteId),
    queryFn: () =>
      notificacoesServico.listar({
        pacienteId,
        status: statusFiltro ?? undefined,
      }),
  });

  if (!pacienteSelecionado) {
    return <PacienteObrigatorio />;
  }

  const notificacoes = notificacoesQuery.data ?? [];

  return (
    <Tela>
      <CabecalhoTela
        titulo="Alertas"
        subtitulo={`Veja notificacoes importantes de ${pacienteSelecionado.nome}.`}
        acao={
          <Botao
            titulo="Atualizar"
            variante="secundario"
            onPress={() => notificacoesQuery.refetch()}
          />
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtros}
      >
        {filtrosStatus.map((filtro) => (
          <TouchableOpacity
            activeOpacity={0.82}
            key={filtro.label}
            onPress={() => setStatusFiltro(filtro.status)}
            style={[styles.pill, statusFiltro === filtro.status && styles.pillSelecionado]}
          >
            <Text
              style={[
                styles.pillTexto,
                statusFiltro === filtro.status && styles.pillTextoSelecionado,
              ]}
            >
              {filtro.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {notificacoesQuery.isLoading ? (
        <EstadoCarregando mensagem="Carregando alertas..." />
      ) : null}

      {notificacoesQuery.isError ? (
        <EstadoErro
          mensagem={
            (notificacoesQuery.error as unknown as ErroApi).mensagem ??
            'Nao foi possivel carregar alertas.'
          }
          acaoTexto="Tentar novamente"
          onAcao={() => notificacoesQuery.refetch()}
        />
      ) : null}

      {notificacoesQuery.isSuccess && notificacoes.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum alerta encontrado"
          mensagem="Quando houver aviso de proxima dose, horario do medicamento ou atraso, ele aparecera aqui."
        />
      ) : null}

      {notificacoes.map((notificacao) => (
        <CartaoNotificacao key={notificacao.id} notificacao={notificacao} />
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  filtros: {
    gap: tema.espacamentos.sm,
    paddingBottom: tema.espacamentos.xs,
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
