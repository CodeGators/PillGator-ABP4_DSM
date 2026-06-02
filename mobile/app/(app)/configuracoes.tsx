import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Badge } from '@/src/componentes/base/Badge';
import { Botao } from '@/src/componentes/base/Botao';
import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { Cartao } from '@/src/componentes/base/Cartao';
import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { EstadoVazio } from '@/src/componentes/base/EstadoVazio';
import { Tela } from '@/src/componentes/base/Tela';
import { tema } from '@/src/config/tema';
import { useAutenticacao } from '@/src/hooks/useAutenticacao';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { dispositivosServico } from '@/src/servicos/dispositivosServico';
import { pacientesServico } from '@/src/servicos/pacientesServico';
import type { ErroApi } from '@/src/tipos/api';
import type { Paciente } from '@/src/tipos/paciente';
import { formatarDataApiParaBr } from '@/src/utils/datas';

export default function ConfiguracoesScreen() {
  const { sair, usuario } = useAutenticacao();
  const { pacienteSelecionado, selecionarPaciente } = usePacienteSelecionado();
  const pacienteId = pacienteSelecionado?.id;

  const pacientesQuery = useQuery({
    queryKey: ['pacientes', 'meus'],
    queryFn: pacientesServico.listarMeus,
  });

  const dispositivosQuery = useQuery({
    queryKey: ['dispositivos', pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: () => dispositivosServico.listar(pacienteId),
  });

  const dispositivo = dispositivosQuery.data?.[0] ?? null;

  const statusGavetaQuery = useQuery({
    queryKey: ['dispositivo-status-configuracoes', dispositivo?.id],
    enabled: Boolean(dispositivo?.id),
    queryFn: () => dispositivosServico.obterStatus(dispositivo!.id),
    refetchInterval: 60000,
  });

  function finalizarSessao() {
    const executar = async () => {
      await sair();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja sair da conta?')) {
        void executar();
      }
      return;
    }

    Alert.alert('Sair da conta', 'Deseja encerrar sua sessao?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: executar },
    ]);
  }

  function trocarPaciente(paciente: Paciente) {
    selecionarPaciente(paciente);
  }

  const pacientes = pacientesQuery.data ?? [];

  return (
    <Tela>
      <CabecalhoTela
        titulo="Ajustes"
        subtitulo="Revise dados da conta, paciente ativo e equipamento PillGator."
      />

      <Cartao>
        <View style={styles.linha}>
          <View style={styles.info}>
            <Text style={styles.titulo}>Responsavel logado</Text>
            <Text style={styles.texto}>{usuario?.nome ?? 'Sessao nao carregada'}</Text>
            <Text style={styles.textoSecundario}>{usuario?.email ?? 'Email indisponivel'}</Text>
          </View>
          {usuario?.tipo ? <Badge texto={usuario.tipo} variante="info" /> : null}
        </View>
        {usuario?.dataNascimento ? (
          <Text style={styles.texto}>
            Nascimento: {formatarDataApiParaBr(usuario.dataNascimento)}
          </Text>
        ) : null}
      </Cartao>

      <Cartao destaque={pacienteSelecionado ? 'sucesso' : 'alerta'} style={styles.cardComGap}>
        <View style={styles.linha}>
          <View style={styles.info}>
            <Text style={styles.titulo}>Paciente selecionado</Text>
            <Text style={styles.texto}>
              {pacienteSelecionado?.nome ?? 'Nenhum paciente selecionado'}
            </Text>
            <Text style={styles.textoSecundario}>
              {pacienteSelecionado?.dataNascimento
                ? `Nascimento: ${formatarDataApiParaBr(pacienteSelecionado.dataNascimento)}`
                : 'Escolha um paciente para as telas de medicamentos, agenda e gavetas.'}
            </Text>
          </View>
          <Badge
            texto={pacienteSelecionado ? 'ativo' : 'pendente'}
            variante={pacienteSelecionado ? 'sucesso' : 'alerta'}
          />
        </View>

        {pacientesQuery.isLoading ? (
          <EstadoCarregando mensagem="Carregando pacientes..." />
        ) : null}

        {pacientesQuery.isError ? (
          <EstadoErro
            mensagem={
              (pacientesQuery.error as unknown as ErroApi).mensagem ??
              'Nao foi possivel carregar pacientes.'
            }
            acaoTexto="Tentar novamente"
            onAcao={() => pacientesQuery.refetch()}
          />
        ) : null}

        {pacientesQuery.isSuccess && pacientes.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum paciente vinculado"
            mensagem="Cadastre um paciente para ativar as telas de cuidado."
          />
        ) : null}

        {pacientes.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pacientesLinha}
          >
            {pacientes.map((paciente) => {
              const selecionado = pacienteSelecionado?.id === paciente.id;

              return (
                <TouchableOpacity
                  activeOpacity={0.82}
                  key={paciente.id}
                  onPress={() => trocarPaciente(paciente)}
                  style={[styles.pacientePill, selecionado && styles.pacientePillSelecionado]}
                >
                  <Text
                    style={[
                      styles.pacientePillTexto,
                      selecionado && styles.pacientePillTextoSelecionado,
                    ]}
                  >
                    {paciente.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
      </Cartao>

      <Cartao destaque={statusGavetaQuery.data?.online ? 'sucesso' : 'alerta'}>
        <View style={styles.linha}>
          <View style={styles.info}>
            <Text style={styles.titulo}>Status da gaveta</Text>
            <Text style={styles.texto}>
              {dispositivosQuery.isLoading || statusGavetaQuery.isLoading
                ? 'Verificando equipamento...'
                : dispositivo
                  ? statusGavetaQuery.data?.online
                    ? 'Gaveta online'
                    : 'Gaveta offline'
                  : 'Equipamento nao configurado'}
            </Text>
            <Text style={styles.textoSecundario}>
              {dispositivo
                ? `${dispositivo.nome} - ${dispositivo.identificador}`
                : 'O equipamento sera configurado pela equipe IoT no backend.'}
            </Text>
            {statusGavetaQuery.data?.ultimoSinalEm ? (
              <Text style={styles.textoSecundario}>
                Ultimo sinal: {formatarDataHoraCurta(statusGavetaQuery.data.ultimoSinalEm)}
              </Text>
            ) : null}
          </View>
          <Badge
            texto={statusGavetaQuery.data?.online ? 'online' : 'offline'}
            variante={statusGavetaQuery.data?.online ? 'sucesso' : 'alerta'}
          />
        </View>

        {dispositivosQuery.isError || statusGavetaQuery.isError ? (
          <EstadoErro
            mensagem={
              ((dispositivosQuery.error ?? statusGavetaQuery.error) as unknown as ErroApi).mensagem ??
              'Nao foi possivel consultar o status da gaveta.'
            }
            acaoTexto="Verificar novamente"
            onAcao={() => {
              dispositivosQuery.refetch();
              statusGavetaQuery.refetch();
            }}
          />
        ) : (
          <View style={styles.acoesLinha}>
            <Botao
              titulo="Verificar"
              variante="secundario"
              onPress={() => {
                dispositivosQuery.refetch();
                statusGavetaQuery.refetch();
              }}
            />
          </View>
        )}
      </Cartao>

      <Botao titulo="Sair" variante="perigo" onPress={finalizarSessao} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  cardComGap: {
    gap: tema.espacamentos.lg,
  },
  linha: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: tema.espacamentos.md,
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  titulo: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.subtitulo,
    fontWeight: '900',
  },
  texto: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    lineHeight: 23,
    marginTop: tema.espacamentos.sm,
  },
  textoSecundario: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    lineHeight: 22,
    marginTop: tema.espacamentos.xs,
  },
  pacientesLinha: {
    gap: tema.espacamentos.sm,
    paddingBottom: tema.espacamentos.xs,
  },
  pacientePill: {
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    paddingHorizontal: tema.espacamentos.md,
    paddingVertical: tema.espacamentos.sm,
  },
  pacientePillSelecionado: {
    backgroundColor: tema.cores.primariaSuave,
    borderColor: tema.cores.primaria,
  },
  pacientePillTexto: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.apoio,
    fontWeight: '900',
  },
  pacientePillTextoSelecionado: {
    color: tema.cores.primaria,
  },
  acoesLinha: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tema.espacamentos.md,
    justifyContent: 'flex-end',
    marginTop: tema.espacamentos.lg,
  },
});

function formatarDataHoraCurta(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data);
}
