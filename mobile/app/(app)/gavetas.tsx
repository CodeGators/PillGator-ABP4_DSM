import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Badge } from '@/src/componentes/base/Badge';
import { Botao } from '@/src/componentes/base/Botao';
import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { CampoTexto } from '@/src/componentes/base/CampoTexto';
import { Cartao } from '@/src/componentes/base/Cartao';
import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { EstadoVazio } from '@/src/componentes/base/EstadoVazio';
import { PacienteObrigatorio } from '@/src/componentes/dominio/PacienteObrigatorio';
import { Tela } from '@/src/componentes/base/Tela';
import { tema } from '@/src/config/tema';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { dispositivosServico } from '@/src/servicos/dispositivosServico';
import { medicamentosServico } from '@/src/servicos/medicamentosServico';
import type { ErroApi } from '@/src/tipos/api';
import type { Compartimento, CriarCompartimentoEntrada, StatusCompartimento } from '@/src/tipos/dispositivo';
import type { Medicamento } from '@/src/tipos/medicamento';

type FormularioCompartimento = {
  numero: string;
  medicamentoId: string;
  observacoes: string;
};

const compartimentoInicial: FormularioCompartimento = {
  numero: '',
  medicamentoId: '',
  observacoes: '',
};

export default function GavetasScreen() {
  const queryClient = useQueryClient();
  const { pacienteSelecionado } = usePacienteSelecionado();
  const [dispositivoSelecionadoId, setDispositivoSelecionadoId] = useState<string | null>(null);
  const [formularioCompartimentoAberto, setFormularioCompartimentoAberto] = useState(false);
  const [formularioCompartimento, setFormularioCompartimento] = useState<FormularioCompartimento>(compartimentoInicial);
  const [compartimentoEditando, setCompartimentoEditando] = useState<Compartimento | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const pacienteId = pacienteSelecionado?.id;

  const dispositivosQuery = useQuery({
    queryKey: ['dispositivos', pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: () => dispositivosServico.listar(pacienteId),
  });

  const medicamentosQuery = useQuery({
    queryKey: ['medicamentos', pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: () => medicamentosServico.listar(pacienteId),
  });

  const dispositivos = dispositivosQuery.data ?? [];
  const medicamentos = medicamentosQuery.data ?? [];

  const dispositivoSelecionado = useMemo(
    () => dispositivos.find((dispositivo) => dispositivo.id === dispositivoSelecionadoId) ?? null,
    [dispositivoSelecionadoId, dispositivos]
  );

  const compartimentosQuery = useQuery({
    queryKey: ['compartimentos', dispositivoSelecionadoId],
    enabled: Boolean(dispositivoSelecionadoId),
    refetchInterval: 10000,
    queryFn: () => dispositivosServico.listarCompartimentos(dispositivoSelecionadoId!),
  });

  const statusQuery = useQuery({
    queryKey: ['dispositivo-status', dispositivoSelecionadoId],
    enabled: Boolean(dispositivoSelecionadoId),
    refetchInterval: 30000,
    queryFn: () => dispositivosServico.obterStatus(dispositivoSelecionadoId!),
  });

  const compartimentos = compartimentosQuery.data ?? [];

  const medicamentosPorId = useMemo(
    () => new Map(medicamentos.map((medicamento) => [medicamento.id, medicamento])),
    [medicamentos]
  );

  const salvarCompartimentoMutation = useMutation({
    mutationFn: () => {
      if (!dispositivoSelecionadoId) {
        throw { status: 0, mensagem: 'Selecione um dispositivo.' } satisfies ErroApi;
      }

      const dados = normalizarCompartimento();

      if (compartimentoEditando) {
        return dispositivosServico.atualizarCompartimento(
          dispositivoSelecionadoId,
          compartimentoEditando.id,
          dados
        );
      }

      return dispositivosServico.criarCompartimento(dispositivoSelecionadoId, dados);
    },
    onSuccess: () => {
      fecharFormularioCompartimento();
      invalidarGavetas();
    },
    onError: (erro) => tratarErroFormulario(erro, 'Nao foi possivel salvar a gaveta.'),
  });

  const comandoCompartimentoMutation = useMutation({
    mutationFn: ({
      acao,
      compartimento,
    }: {
      acao: 'liberar' | 'travar';
      compartimento: Compartimento;
    }) => {
      if (!dispositivoSelecionadoId) {
        throw { status: 0, mensagem: 'Selecione um dispositivo.' } satisfies ErroApi;
      }

      const entrada = {
        motivo: acao === 'liberar' ? 'Liberacao manual pelo app' : 'Travamento manual pelo app',
      };

      return acao === 'liberar'
        ? dispositivosServico.liberarCompartimento(dispositivoSelecionadoId, compartimento.id, entrada)
        : dispositivosServico.travarCompartimento(dispositivoSelecionadoId, compartimento.id, entrada);
    },
    onSuccess: invalidarGavetas,
    onError: (erro) => tratarErroFormulario(erro, 'Nao foi possivel enviar o comando.'),
  });

  useEffect(() => {
    if (dispositivos.length === 0) {
      setDispositivoSelecionadoId(null);
      return;
    }

    if (!dispositivoSelecionadoId || !dispositivos.some((dispositivo) => dispositivo.id === dispositivoSelecionadoId)) {
      setDispositivoSelecionadoId(dispositivos[0].id);
    }
  }, [dispositivoSelecionadoId, dispositivos]);

  if (!pacienteSelecionado) {
    return <PacienteObrigatorio />;
  }

  function invalidarGavetas() {
    queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
    queryClient.invalidateQueries({ queryKey: ['compartimentos'] });
    queryClient.invalidateQueries({ queryKey: ['dispositivo-status'] });
  }

  function abrirNovoCompartimento() {
    setCompartimentoEditando(null);
    setFormularioCompartimento(compartimentoInicial);
    setErroFormulario(null);
    setFormularioCompartimentoAberto(true);
  }

  function abrirEdicaoCompartimento(compartimento: Compartimento) {
    setCompartimentoEditando(compartimento);
    setFormularioCompartimento({
      numero: String(compartimento.numero),
      medicamentoId: compartimento.medicamentoId ?? '',
      observacoes: compartimento.observacoes ?? '',
    });
    setErroFormulario(null);
    setFormularioCompartimentoAberto(true);
  }

  function fecharFormularioCompartimento() {
    setFormularioCompartimentoAberto(false);
    setCompartimentoEditando(null);
    setFormularioCompartimento(compartimentoInicial);
    setErroFormulario(null);
  }

  function normalizarCompartimento(): CriarCompartimentoEntrada {
    const numero = Number(formularioCompartimento.numero);

    if (!Number.isInteger(numero) || numero < 1 || numero > 99) {
      throw { status: 0, mensagem: 'Informe uma gaveta entre 1 e 99.' } satisfies ErroApi;
    }

    return {
      numero,
      medicamentoId: formularioCompartimento.medicamentoId || null,
      status: compartimentoEditando?.status ?? 'bloqueado',
      observacoes: formularioCompartimento.observacoes.trim() || null,
    };
  }

  function salvarCompartimento() {
    setErroFormulario(null);

    try {
      normalizarCompartimento();
      salvarCompartimentoMutation.mutate();
    } catch (erro) {
      tratarErroFormulario(erro, 'Revise os dados da gaveta.');
    }
  }

  function confirmarComando(acao: 'liberar' | 'travar', compartimento: Compartimento) {
    const verbo = acao === 'liberar' ? 'liberar' : 'travar';
    const titulo = acao === 'liberar' ? 'Liberar gaveta' : 'Travar gaveta';
    const mensagem = `${titulo} ${compartimento.numero}?`;
    const executar = () => comandoCompartimentoMutation.mutate({ acao, compartimento });

    if (Platform.OS === 'web') {
      if (window.confirm(mensagem)) {
        executar();
      }
      return;
    }

    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: verbo[0].toUpperCase() + verbo.slice(1),
        style: acao === 'liberar' ? 'default' : 'destructive',
        onPress: executar,
      },
    ]);
  }

  function tratarErroFormulario(erro: unknown, mensagemPadrao: string) {
    const erroApi = erro as ErroApi;
    setErroFormulario(erroApi.mensagem ?? mensagemPadrao);
  }

  return (
    <Tela>
      <CabecalhoTela
        titulo="Gavetas"
        subtitulo={`Monitore o equipamento configurado para ${pacienteSelecionado.nome}.`}
      />

      {erroFormulario ? (
        <EstadoErro mensagem={erroFormulario} titulo="Acao nao concluida" />
      ) : null}

      {dispositivosQuery.isLoading ? (
        <EstadoCarregando mensagem="Carregando dispositivos..." />
      ) : null}

      {dispositivosQuery.isError ? (
        <EstadoErro
          mensagem={
            (dispositivosQuery.error as unknown as ErroApi).mensagem ??
            'Nao foi possivel carregar dispositivos.'
          }
          acaoTexto="Tentar novamente"
          onAcao={() => dispositivosQuery.refetch()}
        />
      ) : null}

      {!dispositivosQuery.isLoading && !dispositivosQuery.isError && dispositivos.length === 0 ? (
        <EstadoVazio
          titulo="Equipamento nao configurado"
          mensagem="O PillGator deste paciente sera configurado pela equipe IoT no backend."
        />
      ) : null}

      {dispositivos.length > 0 ? (
        <Cartao destaque={statusQuery.data?.online ? 'sucesso' : 'alerta'} style={styles.formularioCard}>
          <View style={styles.linha}>
            <View style={styles.info}>
              <Text style={styles.dispositivo}>
                {dispositivoSelecionado?.nome ?? 'Dispositivo'}
              </Text>
              <Text style={styles.texto}>
                {dispositivoSelecionado?.identificador ?? 'Identificador nao informado'}
              </Text>
            </View>
            <Badge
              texto={statusQuery.data?.online ? 'online' : 'offline'}
              variante={statusQuery.data?.online ? 'sucesso' : 'alerta'}
            />
          </View>
          <Text style={styles.texto}>
            {statusQuery.data?.ultimoSinalEm
              ? `Ultimo sinal: ${formatarDataHoraCurta(statusQuery.data.ultimoSinalEm)}`
              : 'Ultimo sinal ainda nao recebido.'}
          </Text>

          {dispositivos.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seletorDispositivos}
            >
              {dispositivos.map((dispositivo) => {
                const selecionado = dispositivo.id === dispositivoSelecionadoId;

                return (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    key={dispositivo.id}
                    onPress={() => setDispositivoSelecionadoId(dispositivo.id)}
                    style={[styles.pill, selecionado && styles.pillSelecionado]}
                  >
                    <Text style={[styles.pillTexto, selecionado && styles.pillTextoSelecionado]}>
                      {dispositivo.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </Cartao>
      ) : null}

      {dispositivoSelecionado ? (
        <View style={styles.linhaAcoesPrincipais}>
          <Botao titulo="Nova gaveta" variante="secundario" onPress={abrirNovoCompartimento} />
          <Botao
            titulo="Atualizar"
            variante="fantasma"
            onPress={() => {
              compartimentosQuery.refetch();
              statusQuery.refetch();
            }}
          />
        </View>
      ) : null}

      {formularioCompartimentoAberto ? (
        <Cartao destaque="info" style={styles.formularioCard}>
          <Text style={styles.tituloCard}>
            {compartimentoEditando ? 'Editar gaveta' : 'Nova gaveta'}
          </Text>
          <CampoTexto
            keyboardType="number-pad"
            label="Numero"
            onChangeText={(valor) =>
              setFormularioCompartimento((estado) => ({
                ...estado,
                numero: valor.replace(/\D/g, '').slice(0, 2),
              }))
            }
            placeholder="1"
            value={formularioCompartimento.numero}
          />

          <View style={styles.secao}>
            <Text style={styles.label}>Medicamento associado</Text>
            <View style={styles.listaOpcoes}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() =>
                  setFormularioCompartimento((estado) => ({ ...estado, medicamentoId: '' }))
                }
                style={[
                  styles.opcaoMedicamento,
                  !formularioCompartimento.medicamentoId && styles.opcaoSelecionada,
                ]}
              >
                <Text
                  style={[
                    styles.opcaoTitulo,
                    !formularioCompartimento.medicamentoId && styles.opcaoTituloSelecionada,
                  ]}
                >
                  Sem medicamento
                </Text>
              </TouchableOpacity>

              {medicamentos.map((medicamento) => {
                const selecionado = formularioCompartimento.medicamentoId === medicamento.id;

                return (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    key={medicamento.id}
                    onPress={() =>
                      setFormularioCompartimento((estado) => ({
                        ...estado,
                        medicamentoId: medicamento.id,
                      }))
                    }
                    style={[styles.opcaoMedicamento, selecionado && styles.opcaoSelecionada]}
                  >
                    <Text style={[styles.opcaoTitulo, selecionado && styles.opcaoTituloSelecionada]}>
                      {medicamento.nome}
                    </Text>
                    <Text style={[styles.opcaoTexto, selecionado && styles.opcaoTextoSelecionada]}>
                      {medicamento.dosagem}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <CampoTexto
            label="Observacoes"
            multiline
            onChangeText={(valor) =>
              setFormularioCompartimento((estado) => ({ ...estado, observacoes: valor }))
            }
            placeholder="Posicao, uso ou reposicao da gaveta"
            style={styles.observacoesInput}
            textAlignVertical="top"
            value={formularioCompartimento.observacoes}
          />

          <View style={styles.acoes}>
            <Botao titulo="Cancelar" variante="secundario" onPress={fecharFormularioCompartimento} />
            <Botao
              carregando={salvarCompartimentoMutation.isPending}
              titulo="Salvar"
              onPress={salvarCompartimento}
            />
          </View>
        </Cartao>
      ) : null}

      {compartimentosQuery.isLoading ? (
        <EstadoCarregando mensagem="Carregando gavetas..." />
      ) : null}

      {compartimentosQuery.isError ? (
        <EstadoErro
          mensagem={
            (compartimentosQuery.error as unknown as ErroApi).mensagem ??
            'Nao foi possivel carregar gavetas.'
          }
          acaoTexto="Tentar novamente"
          onAcao={() => compartimentosQuery.refetch()}
        />
      ) : null}

      {dispositivoSelecionado &&
      compartimentosQuery.isSuccess &&
      compartimentos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma gaveta cadastrada"
          mensagem="Cadastre os compartimentos do PillGator e associe medicamentos quando necessario."
          acaoTexto="Cadastrar gaveta"
          onAcao={abrirNovoCompartimento}
        />
      ) : null}

      {compartimentos.map((compartimento) => {
        const medicamento = obterMedicamento(compartimento, medicamentosPorId);
        const variante = obterVarianteStatus(compartimento.status);

        return (
          <Cartao key={compartimento.id} destaque={variante}>
            <View style={styles.linha}>
              <View style={styles.info}>
                <Text style={styles.nome}>Gaveta {compartimento.numero}</Text>
                <Text style={styles.texto}>
                  {medicamento ? descreverMedicamento(medicamento) : 'Sem medicamento associado'}
                </Text>
              </View>
              <Badge texto={compartimento.status} variante={variante} />
            </View>

            {compartimento.observacoes ? (
              <Text style={styles.texto}>{compartimento.observacoes}</Text>
            ) : null}

            <View style={styles.acoes}>
              <Botao
                titulo="Associar"
                variante="secundario"
                onPress={() => abrirEdicaoCompartimento(compartimento)}
              />
              <Botao
                carregando={comandoCompartimentoMutation.isPending}
                disabled={compartimento.status === 'liberado'}
                titulo="Liberar"
                variante="secundario"
                onPress={() => confirmarComando('liberar', compartimento)}
              />
              <Botao
                carregando={comandoCompartimentoMutation.isPending}
                disabled={compartimento.status === 'bloqueado'}
                titulo="Travar"
                variante="perigo"
                onPress={() => confirmarComando('travar', compartimento)}
              />
            </View>
          </Cartao>
        );
      })}
    </Tela>
  );
}

function obterMedicamento(
  compartimento: Compartimento,
  medicamentosPorId: Map<string, Medicamento>
) {
  return compartimento.medicamentoId
    ? medicamentosPorId.get(compartimento.medicamentoId) ?? null
    : null;
}

function descreverMedicamento(medicamento: Medicamento) {
  return [medicamento.nome, medicamento.dosagem].filter(Boolean).join(' - ');
}

function obterVarianteStatus(status: StatusCompartimento) {
  if (status === 'bloqueado') {
    return 'sucesso' as const;
  }

  if (status === 'liberado' || status === 'aberto') {
    return 'alerta' as const;
  }

  return 'perigo' as const;
}

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

const styles = StyleSheet.create({
  formularioCard: {
    gap: tema.espacamentos.lg,
  },
  linha: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: tema.espacamentos.md,
    justifyContent: 'space-between',
  },
  linhaAcoesPrincipais: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tema.espacamentos.md,
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  dispositivo: {
    color: tema.cores.texto,
    flex: 1,
    fontSize: tema.tipografia.subtitulo,
    fontWeight: '900',
  },
  nome: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.subtitulo,
    fontWeight: '900',
  },
  tituloCard: {
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
  secao: {
    gap: tema.espacamentos.sm,
  },
  label: {
    color: tema.cores.primaria,
    fontSize: tema.tipografia.apoio,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  listaOpcoes: {
    gap: tema.espacamentos.sm,
  },
  opcaoMedicamento: {
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    gap: tema.espacamentos.xs,
    padding: tema.espacamentos.md,
  },
  opcaoSelecionada: {
    backgroundColor: tema.cores.primariaSuave,
    borderColor: tema.cores.primaria,
  },
  opcaoTitulo: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.corpo,
    fontWeight: '900',
  },
  opcaoTituloSelecionada: {
    color: tema.cores.primaria,
  },
  opcaoTexto: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.apoio,
  },
  opcaoTextoSelecionada: {
    color: tema.cores.texto,
  },
  seletorDispositivos: {
    gap: tema.espacamentos.sm,
    paddingTop: tema.espacamentos.sm,
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
  observacoesInput: {
    minHeight: 96,
    paddingTop: tema.espacamentos.md,
  },
  acoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tema.espacamentos.md,
    justifyContent: 'flex-end',
    marginTop: tema.espacamentos.lg,
  },
});
