import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Badge } from '@/src/componentes/base/Badge';
import { Botao } from '@/src/componentes/base/Botao';
import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { CampoTexto } from '@/src/componentes/base/CampoTexto';
import { Cartao } from '@/src/componentes/base/Cartao';
import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { EstadoVazio } from '@/src/componentes/base/EstadoVazio';
import { Tela } from '@/src/componentes/base/Tela';
import { CampoData } from '@/src/componentes/formularios/CampoData';
import { PacienteObrigatorio } from '@/src/componentes/dominio/PacienteObrigatorio';
import { SeletorDiasSemana } from '@/src/componentes/dominio/SeletorDiasSemana';
import { tema } from '@/src/config/tema';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { agendamentosServico } from '@/src/servicos/agendamentosServico';
import { medicamentosServico } from '@/src/servicos/medicamentosServico';
import type {
  Agendamento,
  CriarAgendamentoEntrada,
  TipoAgendamento,
} from '@/src/tipos/agendamento';
import type { ErroApi } from '@/src/tipos/api';
import type { Medicamento } from '@/src/tipos/medicamento';

type FormularioAgendamento = {
  medicamentoId: string;
  tipo: TipoAgendamento;
  diasSemana: number[];
  horariosTexto: string;
  intervaloHoras: string;
  horarioInicio: string;
  inicioEm: string;
  fimEm: string;
  toleranciaMinutos: string;
  cuidados: string;
};

const formularioInicial: FormularioAgendamento = {
  medicamentoId: '',
  tipo: 'horarios_fixos',
  diasSemana: [0, 1, 2, 3, 4, 5, 6],
  horariosTexto: '08:00',
  intervaloHoras: '8',
  horarioInicio: '08:00',
  inicioEm: dataHojeBr(),
  fimEm: '',
  toleranciaMinutos: '30',
  cuidados: '',
};

const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const regexHorario = /^([01]\d|2[0-3]):[0-5]\d$/;
const totalDiasProximasDoses = 30;
const totalDiasAgendamentoSemFim = 7;
const milissegundosPorDia = 24 * 60 * 60 * 1000;

export default function AgendaScreen() {
  const queryClient = useQueryClient();
  const { pacienteSelecionado } = usePacienteSelecionado();
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [modalMedicamentoAberto, setModalMedicamentoAberto] = useState(false);
  const [medicamentoSelecionadoModal, setMedicamentoSelecionadoModal] = useState('');
  const [agendamentoEditando, setAgendamentoEditando] = useState<Agendamento | null>(null);
  const [formulario, setFormulario] = useState<FormularioAgendamento>(formularioInicial);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [erroSelecaoMedicamento, setErroSelecaoMedicamento] = useState<string | null>(null);

  const pacienteId = pacienteSelecionado?.id;
  const dataHoje = useMemo(() => dataHojeBr(), []);
  const datasProximasDoses = useMemo(
    () => obterDatasBrApartirDeHoje(totalDiasProximasDoses),
    []
  );

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

  const proximasAdministracoesQuery = useQuery({
    queryKey: ['proximas-administracoes', pacienteId, datasProximasDoses[0]],
    enabled: Boolean(pacienteId),
    queryFn: async () => {
      const dosesPorDia = await Promise.all(
        datasProximasDoses.map((data) =>
          agendamentosServico.listarProximasAdministracoes(pacienteId!, data)
        )
      );

      return dosesPorDia
        .flat()
        .filter((dose) => {
          const dataDose = converterDataHoraBrParaDate(dose.horarioPrevisto);

          return Boolean(dataDose && dataDose.getTime() >= Date.now());
        })
        .sort((atual, proximo) => {
          const dataAtual = converterDataHoraBrParaDate(atual.horarioPrevisto);
          const dataProximo = converterDataHoraBrParaDate(proximo.horarioPrevisto);

          return (dataAtual?.getTime() ?? 0) - (dataProximo?.getTime() ?? 0);
        });
    },
  });

  const salvarAgendamentoMutation = useMutation({
    mutationFn: async () => {
      const dados = normalizarFormulario();

      if (agendamentoEditando) {
        return agendamentosServico.atualizar(agendamentoEditando.id, dados);
      }

      return agendamentosServico.criar(dados);
    },
    onSuccess: () => {
      fecharFormulario();
      invalidarAgenda();
    },
    onError: (erro) => {
      const erroApi = erro as unknown as ErroApi;
      setErroFormulario(erroApi.mensagem ?? 'Nao foi possivel salvar o agendamento.');
    },
  });

  const removerAgendamentoMutation = useMutation({
    mutationFn: (agendamentoId: string) => agendamentosServico.remover(agendamentoId),
    onSuccess: invalidarAgenda,
  });

  const medicamentos = medicamentosQuery.data ?? [];
  const agendamentos = agendamentosQuery.data ?? [];
  const todasProximasAdministracoes = proximasAdministracoesQuery.data ?? [];
  const medicamentoFormulario = medicamentos.find(
    (medicamento) => medicamento.id === formulario.medicamentoId
  );
  const agendamentoPorId = useMemo(
    () => new Map(agendamentos.map((agendamento) => [agendamento.id, agendamento])),
    [agendamentos]
  );
  const proximasAdministracoes = useMemo(() => {
    const limiteAgendamentoSemFim =
      Date.now() + totalDiasAgendamentoSemFim * milissegundosPorDia;

    return todasProximasAdministracoes.filter((dose) => {
      const agendamento = agendamentoPorId.get(dose.agendamentoId);
      const dataDose = converterDataHoraBrParaDate(dose.horarioPrevisto);

      if (!dataDose || !agendamento || agendamento.fimEm) {
        return true;
      }

      return dataDose.getTime() <= limiteAgendamentoSemFim;
    });
  }, [agendamentoPorId, todasProximasAdministracoes]);

  if (!pacienteSelecionado) {
    return <PacienteObrigatorio />;
  }

  function invalidarAgenda() {
    queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    queryClient.invalidateQueries({ queryKey: ['proximas-administracoes'] });
  }

  function atualizarFormulario(campo: keyof FormularioAgendamento, valor: string) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: campo === 'horariosTexto' ? formatarListaHorariosDigitada(valor) : valor,
    }));
  }

  function alterarTipo(tipo: TipoAgendamento) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      tipo,
    }));
  }

  function abrirNovoAgendamento() {
    setAgendamentoEditando(null);
    setMedicamentoSelecionadoModal(medicamentos[0]?.id ?? '');
    setErroFormulario(null);
    setErroSelecaoMedicamento(null);
    setModalMedicamentoAberto(true);
  }

  function cancelarSelecaoMedicamento() {
    setModalMedicamentoAberto(false);
    setMedicamentoSelecionadoModal('');
    setErroSelecaoMedicamento(null);
  }

  function confirmarSelecaoMedicamento() {
    if (!medicamentoSelecionadoModal) {
      setErroSelecaoMedicamento('Selecione um medicamento para continuar.');
      return;
    }

    setFormulario({
      ...formularioInicial,
      medicamentoId: medicamentoSelecionadoModal,
      inicioEm: dataHoje,
    });
    setModalMedicamentoAberto(false);
    setFormularioAberto(true);
    setErroFormulario(null);
    setErroSelecaoMedicamento(null);
  }

  function abrirEdicaoAgendamento(agendamento: Agendamento) {
    setAgendamentoEditando(agendamento);
    setFormulario({
      medicamentoId: agendamento.medicamentoId,
      tipo: agendamento.tipo,
      diasSemana: agendamento.diasSemana,
      horariosTexto: agendamento.horarios?.join(', ') ?? '08:00',
      intervaloHoras: String(agendamento.intervaloHoras ?? 8),
      horarioInicio: agendamento.horarioInicio ?? '08:00',
      inicioEm: agendamento.inicioEm ?? dataHoje,
      fimEm: agendamento.fimEm ?? '',
      toleranciaMinutos: String(agendamento.toleranciaMinutos),
      cuidados: agendamento.cuidados ?? '',
    });
    setErroFormulario(null);
    setFormularioAberto(true);
  }

  function fecharFormulario() {
    setFormularioAberto(false);
    setModalMedicamentoAberto(false);
    setMedicamentoSelecionadoModal('');
    setAgendamentoEditando(null);
    setFormulario(formularioInicial);
    setErroFormulario(null);
    setErroSelecaoMedicamento(null);
  }

  function normalizarFormulario(): CriarAgendamentoEntrada {
    if (!formulario.medicamentoId) {
      throw { status: 0, mensagem: 'Selecione um medicamento.' } satisfies ErroApi;
    }

    if (formulario.diasSemana.length === 0) {
      throw { status: 0, mensagem: 'Selecione pelo menos um dia da semana.' } satisfies ErroApi;
    }

    const toleranciaMinutos = Number(formulario.toleranciaMinutos);

    if (!Number.isInteger(toleranciaMinutos) || toleranciaMinutos < 0 || toleranciaMinutos > 240) {
      throw {
        status: 0,
        mensagem: 'Informe tolerancia entre 0 e 240 minutos.',
      } satisfies ErroApi;
    }

    const dadosBase = {
      medicamentoId: formulario.medicamentoId,
      tipo: formulario.tipo,
      diasSemana: formulario.diasSemana,
      inicioEm: formulario.inicioEm.trim() || null,
      fimEm: formulario.fimEm.trim() || null,
      toleranciaMinutos,
      cuidados: formulario.cuidados.trim() || null,
    };

    if (formulario.tipo === 'horarios_fixos') {
      const horarios = obterHorariosFormulario(formulario.horariosTexto);

      if (horarios.length === 0) {
        throw { status: 0, mensagem: 'Informe pelo menos um horario.' } satisfies ErroApi;
      }

      return {
        ...dadosBase,
        horarios,
        intervaloHoras: null,
        horarioInicio: null,
      };
    }

    const intervaloHoras = Number(formulario.intervaloHoras);

    if (!Number.isInteger(intervaloHoras) || intervaloHoras < 1 || intervaloHoras > 24) {
      throw {
        status: 0,
        mensagem: 'Informe intervalo entre 1 e 24 horas.',
      } satisfies ErroApi;
    }

    if (!regexHorario.test(formulario.horarioInicio)) {
      throw {
        status: 0,
        mensagem: 'Informe o horario inicial no formato HH:mm.',
      } satisfies ErroApi;
    }

    return {
      ...dadosBase,
      horarios: null,
      intervaloHoras,
      horarioInicio: formulario.horarioInicio,
    };
  }

  function salvarAgendamento() {
    setErroFormulario(null);

    try {
      normalizarFormulario();
      salvarAgendamentoMutation.mutate();
    } catch (erro) {
      const erroApi = erro as ErroApi;
      setErroFormulario(erroApi.mensagem ?? 'Revise os dados do agendamento.');
    }
  }

  function confirmarRemocao(agendamento: Agendamento) {
    const medicamento = obterMedicamentoNome(agendamento, medicamentos);
    const remover = () => removerAgendamentoMutation.mutate(agendamento.id);

    if (Platform.OS === 'web') {
      if (window.confirm(`Remover agendamento de ${medicamento}?`)) {
        remover();
      }
      return;
    }

    Alert.alert(
      'Remover agendamento',
      `Deseja remover agendamento de ${medicamento}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: remover },
      ]
    );
  }

  return (
    <Tela>
      <CabecalhoTela
        titulo="Agenda"
        subtitulo={`Organize horarios fixos, intervalos e dias de uso de ${pacienteSelecionado.nome}.`}
        acao={<Botao titulo="Novo" onPress={abrirNovoAgendamento} />}
      />

      <Modal
        animationType="fade"
        onRequestClose={cancelarSelecaoMedicamento}
        transparent
        visible={modalMedicamentoAberto}
      >
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <Text style={styles.tituloCard}>Selecionar medicamento</Text>
            <Text style={styles.textoSecundario}>
              Escolha o medicamento antes de configurar os horarios.
            </Text>

            {medicamentos.length === 0 ? (
              <EstadoVazio
                titulo="Nenhum medicamento cadastrado"
                mensagem="Cadastre um medicamento antes de criar agendamentos."
              />
            ) : (
              <ScrollView
                style={styles.modalLista}
                contentContainerStyle={styles.modalListaConteudo}
                showsVerticalScrollIndicator={false}
              >
                {medicamentos.map((medicamento) => {
                  const selecionado = medicamentoSelecionadoModal === medicamento.id;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.82}
                      key={medicamento.id}
                      onPress={() => {
                        setMedicamentoSelecionadoModal(medicamento.id);
                        setErroSelecaoMedicamento(null);
                      }}
                      style={[styles.opcao, selecionado && styles.opcaoSelecionada]}
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
              </ScrollView>
            )}

            {erroSelecaoMedicamento ? (
              <EstadoErro mensagem={erroSelecaoMedicamento} titulo="Medicamento nao selecionado" />
            ) : null}

            <View style={styles.acoesLinha}>
              <Botao titulo="Cancelar" variante="secundario" onPress={cancelarSelecaoMedicamento} />
              <Botao
                disabled={medicamentos.length === 0}
                titulo="OK"
                onPress={confirmarSelecaoMedicamento}
              />
            </View>
          </View>
        </View>
      </Modal>

      {proximasAdministracoesQuery.isLoading ? (
        <Cartao destaque="info">
          <EstadoCarregando mensagem="Carregando proximas doses..." />
        </Cartao>
      ) : null}

      {proximasAdministracoesQuery.isError ? (
        <Cartao destaque="info">
          <EstadoErro
            mensagem={
              (proximasAdministracoesQuery.error as unknown as ErroApi).mensagem ??
              'Nao foi possivel carregar proximas doses.'
            }
            acaoTexto="Tentar novamente"
            onAcao={() => proximasAdministracoesQuery.refetch()}
          />
        </Cartao>
      ) : null}

      {proximasAdministracoes.length > 0 ? (
        <Cartao destaque="info" style={styles.carrosselCard}>
          <Text style={styles.tituloCard}>Proximas doses</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carrosselConteudo}
          >
            {proximasAdministracoes.map((dose) => (
              <View
                key={`${dose.agendamentoId}-${dose.horarioPrevisto}`}
                style={styles.doseCard}
              >
                <Text style={styles.dataDose}>{obterDataDeDataHora(dose.horarioPrevisto)}</Text>
                <Text style={styles.horarioDose}>{obterHorarioDeDataHora(dose.horarioPrevisto)}</Text>
                <Text numberOfLines={2} style={styles.nomeDose}>
                  {dose.medicamentoNome}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Cartao>
      ) : null}

      {formularioAberto ? (
        <Cartao destaque="info" style={styles.formularioCard}>
          <Text style={styles.tituloCard}>
            {agendamentoEditando ? 'Editar agendamento' : 'Novo agendamento'}
          </Text>

          {!formulario.medicamentoId ? (
            <EstadoVazio
              titulo="Nenhum medicamento cadastrado"
              mensagem="Cadastre um medicamento antes de criar agendamentos."
            />
          ) : (
            <View style={styles.secao}>
              <Text style={styles.label}>Medicamento</Text>
              <View style={[styles.opcao, styles.opcaoSelecionada]}>
                <Text style={[styles.opcaoTitulo, styles.opcaoTituloSelecionada]}>
                  {medicamentoFormulario?.nome ?? 'Medicamento selecionado'}
                </Text>
                {medicamentoFormulario?.dosagem ? (
                  <Text style={[styles.opcaoTexto, styles.opcaoTextoSelecionada]}>
                    {medicamentoFormulario.dosagem}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          <View style={styles.segmento}>
            <Botao
              titulo="Horarios fixos"
              variante={formulario.tipo === 'horarios_fixos' ? 'primario' : 'secundario'}
              onPress={() => alterarTipo('horarios_fixos')}
              style={styles.segmentoBotao}
            />
            <Botao
              titulo="Intervalo"
              variante={formulario.tipo === 'intervalo' ? 'primario' : 'secundario'}
              onPress={() => alterarTipo('intervalo')}
              style={styles.segmentoBotao}
            />
          </View>

          <SeletorDiasSemana
            diasSelecionados={formulario.diasSemana}
            onChange={(diasSemana) =>
              setFormulario((estadoAtual) => ({ ...estadoAtual, diasSemana }))
            }
          />

          {formulario.tipo === 'horarios_fixos' ? (
            <CampoTexto
              label="Horarios"
              onChangeText={(valor) => atualizarFormulario('horariosTexto', valor)}
              placeholder="08:00, 20:00"
              value={formulario.horariosTexto}
            />
          ) : (
            <View style={styles.duasColunas}>
              <CampoTexto
                containerStyle={styles.coluna}
                keyboardType="number-pad"
                label="Intervalo"
                onChangeText={(valor) => atualizarFormulario('intervaloHoras', valor.replace(/\D/g, '').slice(0, 2))}
                placeholder="8"
                value={formulario.intervaloHoras}
              />
              <CampoTexto
                containerStyle={styles.coluna}
                label="Inicio"
                onChangeText={(valor) => atualizarFormulario('horarioInicio', formatarHorarioDigitado(valor))}
                placeholder="08:00"
                value={formulario.horarioInicio}
              />
            </View>
          )}

          <View style={styles.duasColunas}>
            <CampoData
              containerStyle={styles.coluna}
              label="Inicio"
              onChangeText={(valor) => atualizarFormulario('inicioEm', valor)}
              placeholder="DD/MM/AAAA"
              value={formulario.inicioEm}
            />
            <CampoData
              containerStyle={styles.coluna}
              label="Fim"
              onChangeText={(valor) => atualizarFormulario('fimEm', valor)}
              opcional
              placeholder="Opcional"
              value={formulario.fimEm}
            />
          </View>

          <CampoTexto
            keyboardType="number-pad"
            label="Tolerancia em minutos"
            onChangeText={(valor) => atualizarFormulario('toleranciaMinutos', valor.replace(/\D/g, '').slice(0, 3))}
            placeholder="30"
            value={formulario.toleranciaMinutos}
          />

          <CampoTexto
            label="Cuidados"
            multiline
            onChangeText={(valor) => atualizarFormulario('cuidados', valor)}
            placeholder="Tomar apos refeicao, evitar leite..."
            style={styles.cuidadosInput}
            textAlignVertical="top"
            value={formulario.cuidados}
          />

          {erroFormulario ? (
            <EstadoErro mensagem={erroFormulario} titulo="Agendamento nao salvo" />
          ) : null}

          <View style={styles.acoesLinha}>
            <Botao titulo="Cancelar" variante="secundario" onPress={fecharFormulario} />
            <Botao
              carregando={salvarAgendamentoMutation.isPending}
              disabled={medicamentos.length === 0}
              titulo="Salvar"
              onPress={salvarAgendamento}
            />
          </View>
        </Cartao>
      ) : null}

      {agendamentosQuery.isLoading || medicamentosQuery.isLoading ? (
        <EstadoCarregando mensagem="Carregando agenda..." />
      ) : null}

      {agendamentosQuery.isError ? (
        <EstadoErro
          mensagem={
            (agendamentosQuery.error as unknown as ErroApi).mensagem ??
            'Nao foi possivel carregar a agenda.'
          }
          acaoTexto="Tentar novamente"
          onAcao={() => agendamentosQuery.refetch()}
        />
      ) : null}

      {agendamentos.map((agendamento) => (
        <Cartao key={agendamento.id}>
          <View style={styles.linhaCabecalho}>
            <View style={styles.info}>
              <Text style={styles.nome}>{obterMedicamentoNome(agendamento, medicamentos)}</Text>
              <Text style={styles.detalhe}>{descreverRegra(agendamento)}</Text>
            </View>
            <Badge
              texto={agendamento.tipo === 'horarios_fixos' ? 'fixo' : 'intervalo'}
              variante={agendamento.tipo === 'horarios_fixos' ? 'info' : 'sucesso'}
            />
          </View>

          <View style={styles.metadados}>
            <Badge texto={descreverDias(agendamento.diasSemana)} variante="neutro" />
            <Badge texto={`${agendamento.toleranciaMinutos} min`} variante="alerta" />
          </View>

          {(agendamento.inicioEm || agendamento.fimEm) ? (
            <Text style={styles.texto}>
              {`Tratamento: ${agendamento.inicioEm ?? 'sem inicio'} ate ${agendamento.fimEm ?? 'sem fim'}`}
            </Text>
          ) : null}

          {agendamento.cuidados ? (
            <Text style={styles.texto}>{agendamento.cuidados}</Text>
          ) : null}

          <View style={styles.acoesLinha}>
            <Botao
              titulo="Editar"
              variante="secundario"
              onPress={() => abrirEdicaoAgendamento(agendamento)}
            />
            <Botao
              carregando={removerAgendamentoMutation.isPending}
              titulo="Remover"
              variante="perigo"
              onPress={() => confirmarRemocao(agendamento)}
            />
          </View>
        </Cartao>
      ))}
    </Tela>
  );
}

function dataHojeBr() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

function obterDatasBrApartirDeHoje(totalDias: number) {
  return Array.from({ length: totalDias }, (_item, indice) => {
    const data = new Date();
    data.setDate(data.getDate() + indice);

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
  });
}

function formatarHorarioDigitado(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);

  if (digitos.length <= 2) {
    return digitos;
  }

  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

function formatarListaHorariosDigitada(valor: string) {
  return valor.replace(/[^\d:,\s]/g, '').slice(0, 80);
}

function obterHorariosFormulario(valor: string) {
  const horarios = valor
    .split(',')
    .map((horario) => horario.trim())
    .filter(Boolean);

  if (horarios.some((horario) => !regexHorario.test(horario))) {
    throw {
      status: 0,
      mensagem: 'Informe horarios no formato HH:mm separados por virgula.',
    } satisfies ErroApi;
  }

  return [...new Set(horarios)].sort();
}

function obterHorarioDeDataHora(valor: string) {
  const partes = valor.trim().split(' ');

  return partes[1] ?? valor;
}

function obterDataDeDataHora(valor: string) {
  const partes = valor.trim().split(' ');

  return partes[0] ?? valor;
}

function converterDataHoraBrParaDate(valor: string) {
  const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, dia, mes, ano, hora, minuto] = match;

  return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto));
}

function obterMedicamentoNome(agendamento: Agendamento, medicamentos: Medicamento[]) {
  return agendamento.medicamento?.nome ??
    medicamentos.find((medicamento) => medicamento.id === agendamento.medicamentoId)?.nome ??
    'Medicamento';
}

function descreverRegra(agendamento: Agendamento) {
  if (agendamento.tipo === 'horarios_fixos') {
    return `Horarios: ${agendamento.horarios?.join(', ') ?? '-'}`;
  }

  return `A cada ${agendamento.intervaloHoras}h desde ${agendamento.horarioInicio}`;
}

function descreverDias(diasSemana: number[]) {
  if (diasSemana.length === 7) {
    return 'todos os dias';
  }

  return diasSemana.map((dia) => nomesDias[dia]).join(', ');
}

const styles = StyleSheet.create({
  modalFundo: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: tema.espacamentos.lg,
  },
  modalConteudo: {
    backgroundColor: tema.cores.superficieAlta,
    borderColor: tema.cores.bordaForte,
    borderRadius: tema.raios.lg,
    borderWidth: 1,
    gap: tema.espacamentos.lg,
    maxHeight: '86%',
    maxWidth: 560,
    padding: tema.espacamentos.lg,
    width: '100%',
  },
  modalLista: {
    maxHeight: 360,
  },
  modalListaConteudo: {
    gap: tema.espacamentos.sm,
    paddingBottom: tema.espacamentos.xs,
  },
  formularioCard: {
    gap: tema.espacamentos.lg,
  },
  linhaCabecalho: {
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
  carrosselCard: {
    gap: tema.espacamentos.md,
  },
  carrosselConteudo: {
    gap: tema.espacamentos.md,
    paddingRight: tema.espacamentos.xs,
  },
  doseCard: {
    backgroundColor: tema.cores.superficie,
    borderColor: tema.cores.bordaForte,
    borderRadius: tema.raios.md,
    borderWidth: 1,
    gap: tema.espacamentos.xs,
    minHeight: 136,
    padding: tema.espacamentos.lg,
    width: 176,
  },
  dataDose: {
    color: tema.cores.textoSecundario,
    fontSize: tema.tipografia.apoio,
    fontWeight: '800',
  },
  horarioDose: {
    color: tema.cores.primaria,
    fontSize: 32,
    fontWeight: '900',
  },
  nomeDose: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.corpo,
    fontWeight: '900',
    lineHeight: 22,
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
  opcao: {
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
  segmento: {
    flexDirection: 'row',
    gap: tema.espacamentos.md,
  },
  segmentoBotao: {
    flex: 1,
  },
  duasColunas: {
    flexDirection: 'row',
    gap: tema.espacamentos.md,
  },
  coluna: {
    flex: 1,
  },
  cuidadosInput: {
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
