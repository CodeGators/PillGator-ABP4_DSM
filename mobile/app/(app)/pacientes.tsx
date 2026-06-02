import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/src/componentes/base/Badge';
import { Botao } from '@/src/componentes/base/Botao';
import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { CampoTexto } from '@/src/componentes/base/CampoTexto';
import { Cartao } from '@/src/componentes/base/Cartao';
import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { Tela } from '@/src/componentes/base/Tela';
import { AvatarPaciente } from '@/src/componentes/dominio/AvatarPaciente';
import { tema } from '@/src/config/tema';
import { useAutenticacao } from '@/src/hooks/useAutenticacao';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { pacientesServico } from '@/src/servicos/pacientesServico';
import type { ErroApi } from '@/src/tipos/api';
import type { Paciente } from '@/src/tipos/paciente';
import {
  dataBrValida,
  formatarDataApiParaBr,
  formatarDataDigitada,
} from '@/src/utils/datas';

type FormularioPaciente = {
  nome: string;
  dataNascimento: string;
  observacoes: string;
  fotoUrl: string;
  souEuMesmo: boolean;
};

const formularioInicial: FormularioPaciente = {
  nome: '',
  dataNascimento: '',
  observacoes: '',
  fotoUrl: '',
  souEuMesmo: false,
};

export default function PacientesScreen() {
  const queryClient = useQueryClient();
  const { usuario } = useAutenticacao();
  const {
    carregandoPacienteSelecionado,
    pacienteSelecionado,
    pacienteSelecionadoIdSalvo,
    selecionarPaciente,
  } = usePacienteSelecionado();
  const [formulario, setFormulario] = useState<FormularioPaciente>(formularioInicial);
  const [pacienteEditando, setPacienteEditando] = useState<Paciente | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const pacientesQuery = useQuery({
    queryKey: ['pacientes', 'meus'],
    queryFn: pacientesServico.listarMeus,
  });

  const salvarPacienteMutation = useMutation({
    mutationFn: async () => {
      const dados = normalizarFormulario();

      if (pacienteEditando) {
        return pacientesServico.atualizar(pacienteEditando.id, dados);
      }

      return pacientesServico.criar(dados);
    },
    onSuccess: (pacienteSalvo) => {
      selecionarPaciente(pacienteSalvo);
      fecharFormulario();
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pacientes'] });
    },
    onError: (erro) => {
      const erroApi = erro as unknown as ErroApi;
      setErroFormulario(erroApi.mensagem ?? 'Nao foi possivel salvar o paciente.');
    },
  });

  const removerPacienteMutation = useMutation({
    mutationFn: (pacienteId: string) => pacientesServico.remover(pacienteId),
    onSuccess: (_resultado, pacienteId) => {
      if (pacienteSelecionado?.id === pacienteId) {
        selecionarPaciente(null);
      }

      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pacientes'] });
    },
  });

  useEffect(() => {
    if (
      carregandoPacienteSelecionado ||
      pacientesQuery.isLoading ||
      pacientesQuery.isError
    ) {
      return;
    }

    const pacientes = pacientesQuery.data ?? [];

    if (pacientes.length === 0) {
      selecionarPaciente(null);
      return;
    }

    if (pacienteSelecionado && pacientes.some((paciente) => paciente.id === pacienteSelecionado.id)) {
      return;
    }

    const pacienteSalvo = pacienteSelecionadoIdSalvo
      ? pacientes.find((paciente) => paciente.id === pacienteSelecionadoIdSalvo)
      : null;

    selecionarPaciente(pacienteSalvo ?? pacientes[0]);
  }, [
    carregandoPacienteSelecionado,
    pacienteSelecionado,
    pacienteSelecionadoIdSalvo,
    pacientesQuery.data,
    pacientesQuery.isError,
    pacientesQuery.isLoading,
    selecionarPaciente,
  ]);

  function atualizarFormulario(campo: keyof FormularioPaciente, valor: string | boolean) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: campo === 'dataNascimento' && typeof valor === 'string'
        ? formatarDataDigitada(valor)
        : valor,
    }));
  }

  function abrirNovoPaciente() {
    setPacienteEditando(null);
    setFormulario(formularioInicial);
    setErroFormulario(null);
    setFormularioAberto(true);
  }

  async function selecionarFotoPaciente() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      setErroFormulario('Permita acesso as fotos para escolher uma imagem.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!resultado.canceled) {
      atualizarFormulario('fotoUrl', resultado.assets[0]?.uri ?? '');
    }
  }

  function alternarSouEuMesmo(souEuMesmo: boolean) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      souEuMesmo,
      nome: souEuMesmo && usuario?.nome ? usuario.nome : estadoAtual.nome,
      dataNascimento:
        souEuMesmo && usuario?.dataNascimento
          ? formatarDataApiParaBr(usuario.dataNascimento)
          : estadoAtual.dataNascimento,
    }));
  }

  function abrirEdicaoPaciente(paciente: Paciente) {
    setPacienteEditando(paciente);
    setFormulario({
      nome: paciente.nome,
      dataNascimento: formatarDataApiParaBr(paciente.dataNascimento),
      observacoes: paciente.observacoes ?? '',
      fotoUrl: paciente.fotoUrl ?? '',
      souEuMesmo: false,
    });
    setErroFormulario(null);
    setFormularioAberto(true);
  }

  function fecharFormulario() {
    setFormularioAberto(false);
    setPacienteEditando(null);
    setFormulario(formularioInicial);
    setErroFormulario(null);
  }

  function normalizarFormulario() {
    if (!formulario.nome.trim()) {
      throw { status: 0, mensagem: 'Informe o nome do paciente.' } satisfies ErroApi;
    }

    const dataNascimento = formulario.dataNascimento.trim();

    if (dataNascimento && !dataBrValida(dataNascimento)) {
      throw {
        status: 0,
        mensagem: 'Informe a data de nascimento no formato DD/MM/AAAA.',
      } satisfies ErroApi;
    }

    return {
      nome: formulario.souEuMesmo && usuario?.nome ? usuario.nome : formulario.nome.trim(),
      dataNascimento: dataNascimento || null,
      observacoes: formulario.observacoes.trim() || null,
      fotoUrl: formulario.fotoUrl.trim() || null,
      souEuMesmo: pacienteEditando ? undefined : formulario.souEuMesmo,
    };
  }

  function salvarPaciente() {
    setErroFormulario(null);

    try {
      normalizarFormulario();
      salvarPacienteMutation.mutate();
    } catch (erro) {
      const erroApi = erro as ErroApi;
      setErroFormulario(erroApi.mensagem ?? 'Revise os dados do paciente.');
    }
  }

  function confirmarRemocao(paciente: Paciente) {
    const remover = () => removerPacienteMutation.mutate(paciente.id);

    if (Platform.OS === 'web') {
      if (window.confirm(`Remover ${paciente.nome}?`)) {
        remover();
      }
      return;
    }

    Alert.alert(
      'Remover paciente',
      `Deseja remover ${paciente.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: remover },
      ]
    );
  }

  const pacientes = pacientesQuery.data ?? [];

  return (
    <Tela>
      <CabecalhoTela
        titulo="Pacientes"
        subtitulo="Selecione quem sera acompanhado nas telas de medicamentos, agenda e gavetas."
        acao={<Botao titulo="Novo" onPress={abrirNovoPaciente} />}
      />

      {formularioAberto ? (
        <Cartao destaque="info" style={styles.formularioCard}>
          <Text style={styles.tituloCard}>
            {pacienteEditando ? 'Editar paciente' : 'Novo paciente'}
          </Text>

          {!pacienteEditando ? (
            <View style={styles.segmento}>
              <Botao
                titulo="Sou eu mesmo"
                variante={formulario.souEuMesmo ? 'primario' : 'secundario'}
                onPress={() => alternarSouEuMesmo(true)}
                style={styles.segmentoBotao}
              />
              <Botao
                titulo="Outra pessoa"
                variante={formulario.souEuMesmo ? 'secundario' : 'primario'}
                onPress={() => alternarSouEuMesmo(false)}
                style={styles.segmentoBotao}
              />
            </View>
          ) : null}

          <CampoTexto
            label="Nome"
            onChangeText={(valor) => atualizarFormulario('nome', valor)}
            placeholder="Joao Paciente Teste"
            value={formulario.nome}
          />
          <CampoTexto
            keyboardType="number-pad"
            label="Data de nascimento"
            onChangeText={(valor) => atualizarFormulario('dataNascimento', valor)}
            placeholder="DD/MM/AAAA"
            value={formulario.dataNascimento}
          />
          <CampoTexto
            label="Observacoes"
            multiline
            onChangeText={(valor) => atualizarFormulario('observacoes', valor)}
            placeholder="Cuidados, alergias ou observacoes importantes"
            style={styles.observacoesInput}
            textAlignVertical="top"
            value={formulario.observacoes}
          />
          <View style={styles.fotoLinha}>
            <AvatarPaciente
              fotoUrl={formulario.fotoUrl}
              nome={formulario.nome || 'Paciente'}
              tamanho={72}
            />
            <View style={styles.fotoControles}>
              <CampoTexto
                autoCapitalize="none"
                label="Foto"
                onChangeText={(valor) => atualizarFormulario('fotoUrl', valor)}
                placeholder="URL da foto ou escolha uma imagem"
                value={formulario.fotoUrl}
              />
              <View style={styles.acoesFoto}>
                <Botao
                  titulo="Escolher foto"
                  variante="secundario"
                  onPress={selecionarFotoPaciente}
                />
                {formulario.fotoUrl ? (
                  <Botao
                    titulo="Remover foto"
                    variante="fantasma"
                    onPress={() => atualizarFormulario('fotoUrl', '')}
                  />
                ) : null}
              </View>
            </View>
          </View>

          {erroFormulario ? (
            <EstadoErro mensagem={erroFormulario} titulo="Paciente nao salvo" />
          ) : null}

          <View style={styles.acoesLinha}>
            <Botao titulo="Cancelar" variante="secundario" onPress={fecharFormulario} />
            <Botao
              carregando={salvarPacienteMutation.isPending}
              titulo="Salvar"
              onPress={salvarPaciente}
            />
          </View>
        </Cartao>
      ) : null}

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

      {pacientes.map((paciente) => {
        const selecionado = pacienteSelecionado?.id === paciente.id;

        return (
          <Cartao key={paciente.id} destaque={selecionado ? 'sucesso' : 'padrao'}>
            <View style={styles.linha}>
              <View style={styles.pacienteInfo}>
                <AvatarPaciente
                  fotoUrl={paciente.fotoUrl}
                  nome={paciente.nome}
                  tamanho={56}
                />
                <View style={styles.pacienteTexto}>
                  <Text style={styles.nome}>{paciente.nome}</Text>
                  <Text style={styles.texto}>
                    {paciente.dataNascimento
                      ? `Nascimento: ${formatarDataApiParaBr(paciente.dataNascimento)}`
                      : 'Data de nascimento nao informada'}
                  </Text>
                </View>
              </View>
              <Badge
                texto={selecionado ? 'selecionado' : 'vinculado'}
                variante={selecionado ? 'sucesso' : 'info'}
              />
            </View>
            {paciente.observacoes ? (
              <Text style={styles.texto}>{paciente.observacoes}</Text>
            ) : null}

            <View style={styles.acoesLinha}>
              <Botao
                titulo="Selecionar"
                variante={selecionado ? 'primario' : 'secundario'}
                onPress={() => selecionarPaciente(paciente)}
              />
              <Botao titulo="Editar" variante="secundario" onPress={() => abrirEdicaoPaciente(paciente)} />
              <Botao
                carregando={removerPacienteMutation.isPending}
                titulo="Remover"
                variante="perigo"
                onPress={() => confirmarRemocao(paciente)}
              />
            </View>
          </Cartao>
        );
      })}
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
  pacienteInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: tema.espacamentos.md,
    minWidth: 0,
  },
  pacienteTexto: {
    flex: 1,
    minWidth: 0,
  },
  nome: {
    color: tema.cores.texto,
    flex: 1,
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
  observacoesInput: {
    minHeight: 96,
    paddingTop: tema.espacamentos.md,
  },
  fotoLinha: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: tema.espacamentos.lg,
  },
  fotoControles: {
    flex: 1,
    gap: tema.espacamentos.md,
    minWidth: 0,
  },
  acoesFoto: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tema.espacamentos.md,
  },
  segmento: {
    flexDirection: 'row',
    gap: tema.espacamentos.md,
  },
  segmentoBotao: {
    flex: 1,
  },
  acoesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tema.espacamentos.md,
    marginTop: tema.espacamentos.lg,
  },
});
