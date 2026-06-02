import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Badge } from '@/src/componentes/base/Badge';
import { Botao } from '@/src/componentes/base/Botao';
import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { EstadoVazio } from '@/src/componentes/base/EstadoVazio';
import { Tela } from '@/src/componentes/base/Tela';
import { AvatarPaciente } from '@/src/componentes/dominio/AvatarPaciente';
import { tema } from '@/src/config/tema';
import { useAutenticacao } from '@/src/hooks/useAutenticacao';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { agendamentosServico } from '@/src/servicos/agendamentosServico';
import { medicamentosServico } from '@/src/servicos/medicamentosServico';
import { pacientesServico } from '@/src/servicos/pacientesServico';
import type { ErroApi } from '@/src/tipos/api';
import type { Paciente } from '@/src/tipos/paciente';

type ResumoPaciente = {
  paciente: Paciente;
  medicamentos: number;
  proximaDose: string | null;
  pendente: boolean;
};

export default function InicioScreen() {
  const { usuario } = useAutenticacao();
  const { pacienteSelecionado, selecionarPaciente } = usePacienteSelecionado();
  const dataHoje = obterDataHojeBr();

  const painelQuery = useQuery({
    queryKey: ['dashboard-pacientes', dataHoje],
    queryFn: async () => {
      const pacientes = await pacientesServico.listarMeus();
      const resumos = await Promise.all(
        pacientes.map(async (paciente) => {
          const [medicamentos, proximasDoses] = await Promise.all([
            medicamentosServico.listar(paciente.id),
            agendamentosServico.listarProximasAdministracoes(paciente.id, dataHoje),
          ]);
          const proximasOrdenadas = proximasDoses
            .filter((dose) => {
              const dataDose = converterDataHoraBrParaDate(dose.horarioPrevisto);

              return Boolean(dataDose && dataDose.getTime() >= Date.now());
            })
            .sort((atual, proximo) => {
              const dataAtual = converterDataHoraBrParaDate(atual.horarioPrevisto);
              const dataProximo = converterDataHoraBrParaDate(proximo.horarioPrevisto);

              return (dataAtual?.getTime() ?? 0) - (dataProximo?.getTime() ?? 0);
            });

          return {
            paciente,
            medicamentos: medicamentos.length,
            proximaDose: proximasOrdenadas[0]?.horarioPrevisto ?? null,
            pendente: medicamentos.length > 0 && proximasOrdenadas.length === 0,
          } satisfies ResumoPaciente;
        })
      );

      return {
        pacientes,
        resumos,
        dosesHoje: resumos.filter((resumo) => resumo.proximaDose).length,
        pendentes: resumos.filter((resumo) => resumo.pendente).length,
      };
    },
  });

  useFocusEffect(
    useCallback(() => {
      void painelQuery.refetch();
    }, [painelQuery.refetch])
  );

  const resumos = painelQuery.data?.resumos ?? [];
  const nome = usuario?.nome?.split(' ')[0] ?? 'Responsavel';

  function selecionarResumo(resumo: ResumoPaciente) {
    selecionarPaciente(resumo.paciente);
    router.push('/(app)/pacientes');
  }

  return (
    <Tela contentContainerStyle={styles.tela}>
      <View style={styles.hero}>
        <Text style={styles.saudacao}>Ola, {nome}</Text>
        <Text style={styles.titulo}>Painel</Text>
        <Text style={styles.subtitulo}>
          {`${formatarDataLonga(new Date())} · ${painelQuery.data?.pacientes.length ?? 0} pacientes ativos`}
        </Text>
      </View>

      <View style={styles.metricas}>
        <View style={styles.metricaCard}>
          <Text style={styles.metricaNumero}>{painelQuery.data?.pacientes.length ?? 0}</Text>
          <Text style={styles.metricaRotulo}>Pacientes</Text>
        </View>
        <View style={styles.metricaCard}>
          <Text style={styles.metricaNumero}>{painelQuery.data?.dosesHoje ?? 0}</Text>
          <Text style={styles.metricaRotulo}>Doses hoje</Text>
        </View>
        <View style={styles.metricaCard}>
          <Text style={[styles.metricaNumero, styles.numeroAlerta]}>
            {painelQuery.data?.pendentes ?? 0}
          </Text>
          <Text style={styles.metricaRotulo}>Pendente</Text>
        </View>
      </View>

      <View style={styles.secaoCabecalho}>
        <Text style={styles.secaoTitulo}>Pacientes</Text>
        <Botao
          titulo="Novo"
          variante="fantasma"
          onPress={() => router.push('/(app)/pacientes')}
        />
      </View>

      {painelQuery.isLoading ? (
        <EstadoCarregando mensagem="Carregando painel..." />
      ) : null}

      {painelQuery.isError ? (
        <EstadoErro
          mensagem={
            (painelQuery.error as unknown as ErroApi).mensagem ??
            'Nao foi possivel carregar o painel.'
          }
          acaoTexto="Tentar novamente"
          onAcao={() => painelQuery.refetch()}
        />
      ) : null}

      {!painelQuery.isLoading && !painelQuery.isError && resumos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum paciente cadastrado"
          mensagem="Cadastre um paciente para acompanhar medicamentos e proximas doses."
          acaoTexto="Cadastrar paciente"
          onAcao={() => router.push('/(app)/pacientes')}
        />
      ) : null}

      <View style={styles.lista}>
        {resumos.map((resumo) => {
          const selecionado = resumo.paciente.id === pacienteSelecionado?.id;
          const status = resumo.pendente ? 'Pendente' : 'Em dia';
          const proximaDose = resumo.proximaDose
            ? `proximo as ${obterHorarioDeDataHora(resumo.proximaDose)}`
            : 'sem dose hoje';

          return (
            <TouchableOpacity
              activeOpacity={0.84}
              accessibilityLabel={`Selecionar paciente ${resumo.paciente.nome}`}
              accessibilityRole="button"
              key={resumo.paciente.id}
              onPress={() => selecionarResumo(resumo)}
              style={[styles.pacienteCard, selecionado && styles.pacienteSelecionado]}
            >
              <AvatarPaciente
                fotoUrl={resumo.paciente.fotoUrl}
                nome={resumo.paciente.nome}
                tamanho={48}
              />
              <View style={styles.pacienteInfo}>
                <Text numberOfLines={1} style={styles.pacienteNome}>
                  {resumo.paciente.nome}
                </Text>
                <Text numberOfLines={2} style={styles.pacienteDetalhe}>
                  {`${resumo.medicamentos} medicamento${resumo.medicamentos === 1 ? '' : 's'} · ${proximaDose}`}
                </Text>
              </View>
              <Badge
                texto={status}
                variante={resumo.pendente ? 'alerta' : 'sucesso'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </Tela>
  );
}

function obterDataHojeBr() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

function formatarDataLonga(data: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
  }).format(data);
}

function obterHorarioDeDataHora(valor: string) {
  const partes = valor.trim().split(' ');

  return partes[1] ?? valor;
}

function converterDataHoraBrParaDate(valor: string) {
  const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, dia, mes, ano, hora, minuto] = match;

  return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto));
}

const styles = StyleSheet.create({
  tela: {
    gap: 0,
    padding: 0,
    paddingBottom: 128,
  },
  hero: {
    backgroundColor: tema.cores.primaria,
    gap: tema.espacamentos.xs,
    paddingHorizontal: tema.espacamentos.xl,
    paddingVertical: tema.espacamentos.xl,
  },
  saudacao: {
    color: tema.cores.preto,
    fontSize: tema.tipografia.corpo,
    fontWeight: '700',
  },
  titulo: {
    color: tema.cores.preto,
    fontSize: tema.tipografia.titulo,
    fontWeight: '900',
  },
  subtitulo: {
    color: tema.cores.preto,
    fontSize: tema.tipografia.apoio,
    fontWeight: '700',
    opacity: 0.82,
  },
  metricas: {
    flexDirection: 'row',
    gap: tema.espacamentos.sm,
    paddingHorizontal: tema.espacamentos.lg,
    paddingTop: tema.espacamentos.lg,
  },
  metricaCard: {
    alignItems: 'center',
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 78,
    justifyContent: 'center',
    padding: tema.espacamentos.md,
  },
  metricaNumero: {
    color: tema.cores.primaria,
    fontSize: 26,
    fontWeight: '900',
  },
  numeroAlerta: {
    color: tema.cores.alerta,
  },
  metricaRotulo: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.legenda,
    fontWeight: '800',
    marginTop: tema.espacamentos.xs,
    textAlign: 'center',
  },
  secaoCabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: tema.espacamentos.xl,
    paddingTop: tema.espacamentos.xl,
  },
  secaoTitulo: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.apoio,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  lista: {
    gap: tema.espacamentos.md,
    padding: tema.espacamentos.xl,
    paddingTop: tema.espacamentos.sm,
  },
  pacienteCard: {
    alignItems: 'center',
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.bordaForte,
    borderRadius: tema.raios.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: tema.espacamentos.md,
    minHeight: 76,
    padding: tema.espacamentos.md,
  },
  pacienteSelecionado: {
    borderColor: tema.cores.primaria,
  },
  pacienteInfo: {
    flex: 1,
    minWidth: 0,
  },
  pacienteNome: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.corpo,
    fontWeight: '900',
  },
  pacienteDetalhe: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.apoio,
    lineHeight: 19,
    marginTop: 2,
  },
});
