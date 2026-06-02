import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Badge } from '@/src/componentes/base/Badge';
import { Botao } from '@/src/componentes/base/Botao';
import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { CampoTexto } from '@/src/componentes/base/CampoTexto';
import { Cartao } from '@/src/componentes/base/Cartao';
import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { EstadoVazio } from '@/src/componentes/base/EstadoVazio';
import { Tela } from '@/src/componentes/base/Tela';
import { PacienteObrigatorio } from '@/src/componentes/dominio/PacienteObrigatorio';
import { tema } from '@/src/config/tema';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { baseMedicamentosServico } from '@/src/servicos/baseMedicamentosServico';
import { medicamentosServico } from '@/src/servicos/medicamentosServico';
import type { ErroApi } from '@/src/tipos/api';
import type { BaseMedicamento, Medicamento } from '@/src/tipos/medicamento';

type FormularioMedicamento = {
  buscaBase: string;
  baseMedicamentoId: string | null;
  baseMedicamento: BaseMedicamento | null;
  nome: string;
  dosagem: string;
  quantidadeAdministrada: string;
  unidadeAdministracao: string;
  observacoes: string;
};

const formularioInicial: FormularioMedicamento = {
  buscaBase: '',
  baseMedicamentoId: null,
  baseMedicamento: null,
  nome: '',
  dosagem: '',
  quantidadeAdministrada: '',
  unidadeAdministracao: '',
  observacoes: '',
};

const unidadesAdministracao = ['Gotas', 'Comprimidos', 'mililitros(ml)'];

export default function MedicamentosScreen() {
  const queryClient = useQueryClient();
  const { pacienteSelecionado } = usePacienteSelecionado();
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [medicamentoEditando, setMedicamentoEditando] = useState<Medicamento | null>(null);
  const [formulario, setFormulario] = useState<FormularioMedicamento>(formularioInicial);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const pacienteId = pacienteSelecionado?.id;
  const buscaBase = formulario.buscaBase.trim();

  const medicamentosQuery = useQuery({
    queryKey: ['medicamentos', pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: () => medicamentosServico.listar(pacienteId),
  });

  const baseMedicamentosQuery = useQuery({
    queryKey: ['base-medicamentos', buscaBase],
    enabled: formularioAberto && buscaBase.length >= 2,
    queryFn: () => baseMedicamentosServico.listar(buscaBase),
  });

  const salvarMedicamentoMutation = useMutation({
    mutationFn: async () => {
      const dados = normalizarFormulario();

      if (medicamentoEditando) {
        return medicamentosServico.atualizar(medicamentoEditando.id, {
          baseMedicamentoId: dados.baseMedicamentoId,
          nome: dados.nome,
          dosagem: dados.dosagem,
          quantidadeAdministrada: dados.quantidadeAdministrada,
          unidadeAdministracao: dados.unidadeAdministracao,
          observacoes: dados.observacoes,
        });
      }

      return medicamentosServico.criar(dados);
    },
    onSuccess: () => {
      fecharFormulario();
      queryClient.invalidateQueries({ queryKey: ['medicamentos'] });
    },
    onError: (erro) => {
      const erroApi = erro as unknown as ErroApi;
      setErroFormulario(erroApi.mensagem ?? 'Nao foi possivel salvar o medicamento.');
    },
  });

  const removerMedicamentoMutation = useMutation({
    mutationFn: (medicamentoId: string) => medicamentosServico.remover(medicamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicamentos'] });
    },
  });

  const medicamentos = medicamentosQuery.data ?? [];
  const resultadosBase = useMemo(
    () => baseMedicamentosQuery.data ?? [],
    [baseMedicamentosQuery.data]
  );

  if (!pacienteSelecionado) {
    return <PacienteObrigatorio />;
  }

  function atualizarFormulario(campo: keyof FormularioMedicamento, valor: string) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }));
  }

  function abrirNovoMedicamento() {
    setMedicamentoEditando(null);
    setFormulario(formularioInicial);
    setErroFormulario(null);
    setFormularioAberto(true);
  }

  function abrirEdicaoMedicamento(medicamento: Medicamento) {
    setMedicamentoEditando(medicamento);
    setFormulario({
      buscaBase: '',
      baseMedicamentoId: medicamento.baseMedicamentoId,
      baseMedicamento: null,
      nome: medicamento.nome,
      dosagem: medicamento.dosagem,
      quantidadeAdministrada: medicamento.quantidadeAdministrada ?? '',
      unidadeAdministracao: medicamento.unidadeAdministracao ?? '',
      observacoes: medicamento.observacoes ?? '',
    });
    setErroFormulario(null);
    setFormularioAberto(true);
  }

  function selecionarMedicamentoBase(medicamentoBase: BaseMedicamento) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      baseMedicamentoId: medicamentoBase.id,
      baseMedicamento: medicamentoBase,
      buscaBase: medicamentoBase.nomeProduto,
      nome: medicamentoBase.nomeProduto,
      dosagem: medicamentoBase.concentracao ?? estadoAtual.dosagem,
    }));
  }

  function usarCadastroManual() {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      baseMedicamentoId: null,
      baseMedicamento: null,
      buscaBase: '',
    }));
  }

  function fecharFormulario() {
    setFormularioAberto(false);
    setMedicamentoEditando(null);
    setFormulario(formularioInicial);
    setErroFormulario(null);
  }

  function normalizarFormulario() {
    if (!pacienteSelecionado) {
      throw { status: 0, mensagem: 'Selecione um paciente.' } satisfies ErroApi;
    }

    const nome = formulario.nome.trim();
    const dosagem = formulario.dosagem.trim();
    const quantidadeAdministrada = formulario.quantidadeAdministrada.trim();
    const unidadeAdministracao = formulario.unidadeAdministracao.trim();

    if (!nome) {
      throw { status: 0, mensagem: 'Informe o nome do medicamento.' } satisfies ErroApi;
    }

    if (!dosagem) {
      throw { status: 0, mensagem: 'Informe a dosagem.' } satisfies ErroApi;
    }

    if (!quantidadeAdministrada) {
      throw { status: 0, mensagem: 'Informe a quantidade administrada.' } satisfies ErroApi;
    }

    if (!unidadeAdministracao) {
      throw { status: 0, mensagem: 'Informe a unidade de administracao.' } satisfies ErroApi;
    }

    return {
      pacienteId: pacienteSelecionado.id,
      baseMedicamentoId: formulario.baseMedicamento?.id ?? formulario.baseMedicamentoId,
      nome,
      dosagem,
      quantidadeAdministrada,
      unidadeAdministracao,
      observacoes: formulario.observacoes.trim() || null,
    };
  }

  function salvarMedicamento() {
    setErroFormulario(null);

    try {
      normalizarFormulario();
      salvarMedicamentoMutation.mutate();
    } catch (erro) {
      const erroApi = erro as ErroApi;
      setErroFormulario(erroApi.mensagem ?? 'Revise os dados do medicamento.');
    }
  }

  function confirmarRemocao(medicamento: Medicamento) {
    const remover = () => removerMedicamentoMutation.mutate(medicamento.id);

    if (Platform.OS === 'web') {
      if (window.confirm(`Remover ${medicamento.nome}?`)) {
        remover();
      }
      return;
    }

    Alert.alert(
      'Remover medicamento',
      `Deseja remover ${medicamento.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: remover },
      ]
    );
  }

  return (
    <Tela>
      <CabecalhoTela
        titulo="Medicamentos"
        subtitulo={`Cadastre remedios, dosagens e orientacoes de ${pacienteSelecionado.nome}.`}
        acao={<Botao titulo="Novo" onPress={abrirNovoMedicamento} />}
      />

      {formularioAberto ? (
        <Cartao destaque="info" style={styles.formularioCard}>
          <View style={styles.linha}>
            <View style={styles.info}>
              <Text style={styles.tituloCard}>
                {medicamentoEditando ? 'Editar medicamento' : 'Novo medicamento'}
              </Text>
              <Text style={styles.textoSecundario}>
                Paciente: {pacienteSelecionado.nome}
              </Text>
            </View>
            {formulario.baseMedicamento || formulario.baseMedicamentoId ? (
              <Badge texto="base" variante="info" />
            ) : (
              <Badge texto="manual" variante="neutro" />
            )}
          </View>

          <CampoTexto
            label="Buscar na base"
            onChangeText={(valor) => atualizarFormulario('buscaBase', valor)}
            placeholder="Digite pelo menos 2 letras"
            value={formulario.buscaBase}
          />

          {formulario.baseMedicamento ? (
            <View style={[styles.painelInterno, styles.painelSucesso]}>
              <Text style={styles.nomeResultado}>{formulario.baseMedicamento.nomeProduto}</Text>
              <Text style={styles.textoSecundario}>
                {formulario.baseMedicamento.principioAtivo ?? 'Principio ativo nao informado'}
              </Text>
              <Botao
                titulo="Usar cadastro manual"
                variante="secundario"
                onPress={usarCadastroManual}
              />
            </View>
          ) : null}

          {!formulario.baseMedicamento && buscaBase.length >= 2 ? (
            <View style={styles.resultados}>
              {baseMedicamentosQuery.isLoading ? (
                <EstadoCarregando mensagem="Buscando medicamentos..." />
              ) : null}

              {baseMedicamentosQuery.isError ? (
                <EstadoErro
                  mensagem={
                    (baseMedicamentosQuery.error as unknown as ErroApi).mensagem ??
                    'Nao foi possivel buscar medicamentos da base.'
                  }
                  titulo="Busca indisponivel"
                />
              ) : null}

              {!baseMedicamentosQuery.isLoading &&
              !baseMedicamentosQuery.isError &&
              resultadosBase.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhum item encontrado"
                  mensagem="Continue com o cadastro manual preenchendo nome e dosagem."
                />
              ) : null}

              {resultadosBase.slice(0, 5).map((medicamentoBase) => (
                <View key={medicamentoBase.id} style={styles.resultadoCard}>
                  <View style={styles.linha}>
                    <View style={styles.info}>
                      <Text style={styles.nomeResultado}>
                        {medicamentoBase.nomeProduto}
                      </Text>
                      <Text style={styles.textoSecundario}>
                        {medicamentoBase.concentracao ?? 'Concentracao nao informada'}
                      </Text>
                    </View>
                    <Botao
                      titulo="Usar"
                      variante="secundario"
                      onPress={() => selecionarMedicamentoBase(medicamentoBase)}
                    />
                  </View>
                  {medicamentoBase.principioAtivo ? (
                    <Text style={styles.textoSecundario}>
                      {medicamentoBase.principioAtivo}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          <CampoTexto
            label="Nome"
            onChangeText={(valor) => atualizarFormulario('nome', valor)}
            placeholder="Losartana"
            value={formulario.nome}
          />
          <CampoTexto
            label="Dosagem"
            onChangeText={(valor) => atualizarFormulario('dosagem', valor)}
            placeholder="50mg"
            value={formulario.dosagem}
          />

          <View style={styles.duasColunas}>
            <CampoTexto
              containerStyle={styles.coluna}
              label="Quantidade"
              onChangeText={(valor) => atualizarFormulario('quantidadeAdministrada', valor)}
              placeholder="1"
              value={formulario.quantidadeAdministrada}
            />
            <View style={[styles.coluna, styles.seletorUnidade]}>
              <Text style={styles.label}>Unidade</Text>
              <View style={styles.opcoesUnidade}>
                {unidadesAdministracao.map((unidade) => {
                  const selecionada = formulario.unidadeAdministracao === unidade;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.82}
                      key={unidade}
                      onPress={() => atualizarFormulario('unidadeAdministracao', unidade)}
                      style={[
                        styles.unidadeOpcao,
                        selecionada && styles.unidadeOpcaoSelecionada,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unidadeTexto,
                          selecionada && styles.unidadeTextoSelecionado,
                        ]}
                      >
                        {unidade}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <CampoTexto
            label="Observacoes"
            multiline
            onChangeText={(valor) => atualizarFormulario('observacoes', valor)}
            placeholder="Tomar com agua, apos refeicao..."
            style={styles.observacoesInput}
            textAlignVertical="top"
            value={formulario.observacoes}
          />

          {erroFormulario ? (
            <EstadoErro mensagem={erroFormulario} titulo="Medicamento nao salvo" />
          ) : null}

          <View style={styles.acoesLinha}>
            <Botao titulo="Cancelar" variante="secundario" onPress={fecharFormulario} />
            <Botao
              carregando={salvarMedicamentoMutation.isPending}
              titulo="Salvar"
              onPress={salvarMedicamento}
            />
          </View>
        </Cartao>
      ) : null}

      {medicamentosQuery.isLoading ? (
        <EstadoCarregando mensagem="Carregando medicamentos..." />
      ) : null}

      {medicamentosQuery.isError ? (
        <EstadoErro
          mensagem={
            (medicamentosQuery.error as unknown as ErroApi).mensagem ??
            'Nao foi possivel carregar medicamentos.'
          }
          acaoTexto="Tentar novamente"
          onAcao={() => medicamentosQuery.refetch()}
        />
      ) : null}

      {medicamentos.map((medicamento) => (
        <Cartao key={medicamento.id}>
          <View style={styles.linha}>
            <View style={styles.info}>
              <Text style={styles.nome}>{medicamento.nome}</Text>
              <Text style={styles.detalhe}>{medicamento.dosagem}</Text>
            </View>
            <Badge
              texto={medicamento.baseMedicamentoId ? 'base' : 'manual'}
              variante={medicamento.baseMedicamentoId ? 'info' : 'neutro'}
            />
          </View>

          <View style={styles.metadados}>
            <Badge
              texto={`${medicamento.quantidadeAdministrada ?? '-'} ${medicamento.unidadeAdministracao ?? ''}`.trim()}
              variante="sucesso"
            />
          </View>

          {medicamento.observacoes ? (
            <Text style={styles.texto}>{medicamento.observacoes}</Text>
          ) : null}

          <View style={styles.acoesLinha}>
            <Botao
              titulo="Editar"
              variante="secundario"
              onPress={() => abrirEdicaoMedicamento(medicamento)}
            />
            <Botao
              carregando={removerMedicamentoMutation.isPending}
              titulo="Remover"
              variante="perigo"
              onPress={() => confirmarRemocao(medicamento)}
            />
          </View>
        </Cartao>
      ))}
    </Tela>
  );
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
  info: {
    flex: 1,
  },
  tituloCard: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.subtitulo,
    fontWeight: '900',
  },
  nome: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.subtitulo,
    fontWeight: '900',
  },
  detalhe: {
    color: tema.cores.primaria,
    fontSize: tema.tipografia.corpo,
    fontWeight: '800',
    marginTop: tema.espacamentos.xs,
  },
  texto: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.corpo,
    lineHeight: 23,
    marginTop: tema.espacamentos.md,
  },
  textoSecundario: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.apoio,
    lineHeight: 20,
  },
  resultados: {
    gap: tema.espacamentos.md,
  },
  resultadoCard: {
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    gap: tema.espacamentos.sm,
    padding: tema.espacamentos.md,
  },
  painelInterno: {
    borderRadius: tema.raios.md,
    borderWidth: 1,
    gap: tema.espacamentos.md,
    padding: tema.espacamentos.md,
  },
  painelSucesso: {
    backgroundColor: tema.cores.primariaSuave,
    borderColor: tema.cores.primaria,
  },
  nomeResultado: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.corpo,
    fontWeight: '900',
  },
  duasColunas: {
    flexDirection: 'row',
    gap: tema.espacamentos.md,
  },
  coluna: {
    flex: 1,
  },
  seletorUnidade: {
    gap: tema.espacamentos.sm,
  },
  label: {
    color: tema.cores.primaria,
    fontSize: tema.tipografia.apoio,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  opcoesUnidade: {
    gap: tema.espacamentos.sm,
  },
  unidadeOpcao: {
    alignItems: 'center',
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.borda,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: tema.espacamentos.sm,
    paddingVertical: tema.espacamentos.sm,
  },
  unidadeOpcaoSelecionada: {
    backgroundColor: tema.cores.primariaSuave,
    borderColor: tema.cores.primaria,
  },
  unidadeTexto: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.apoio,
    fontWeight: '900',
    textAlign: 'center',
  },
  unidadeTextoSelecionado: {
    color: tema.cores.primaria,
  },
  observacoesInput: {
    minHeight: 96,
    paddingTop: tema.espacamentos.md,
  },
  acoesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tema.espacamentos.md,
    justifyContent: 'flex-end',
  },
  metadados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tema.espacamentos.sm,
    marginTop: tema.espacamentos.md,
  },
});
