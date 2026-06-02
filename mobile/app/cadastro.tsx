import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Botao } from '@/src/componentes/base/Botao';
import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { CampoTexto } from '@/src/componentes/base/CampoTexto';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { Tela } from '@/src/componentes/base/Tela';
import { tema } from '@/src/config/tema';
import { cepsServico } from '@/src/servicos/cepsServico';
import { usuariosServico } from '@/src/servicos/usuariosServico';
import type { ErroApi } from '@/src/tipos/api';
import { dataBrValida, formatarDataDigitada } from '@/src/utils/datas';

type CamposCadastro = {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  enderecoBairro: string;
  enderecoRua: string;
  enderecoEstado: string;
  enderecoCidade: string;
  enderecoCep: string;
  enderecoComplemento: string;
  senha: string;
  confirmarSenha: string;
};

const camposIniciais: CamposCadastro = {
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  enderecoBairro: '',
  enderecoRua: '',
  enderecoEstado: 'SP',
  enderecoCidade: '',
  enderecoCep: '',
  enderecoComplemento: '',
  senha: '',
  confirmarSenha: '',
};

export default function CadastroScreen() {
  const [campos, setCampos] = useState<CamposCadastro>(camposIniciais);
  const [enviando, setEnviando] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [cepConsultado, setCepConsultado] = useState('');
  const [erroCep, setErroCep] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const cep = campos.enderecoCep.replace(/\D/g, '');

    if (cep.length === 8 && cep !== cepConsultado) {
      void consultarCep(cep);
    }
  }, [campos.enderecoCep, cepConsultado]);

  function atualizarCampo(campo: keyof CamposCadastro, valor: string) {
    let valorNormalizado = valor;

    if (campo === 'dataNascimento') {
      valorNormalizado = formatarDataDigitada(valor);
    }

    if (campo === 'enderecoCep') {
      valorNormalizado = valor.replace(/\D/g, '').slice(0, 8);
      setErroCep(null);
    }

    setCampos((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valorNormalizado,
    }));
  }

  async function consultarCep(cepAtual = campos.enderecoCep) {
    const cep = cepAtual.replace(/\D/g, '');

    if (cep.length !== 8) {
      setErroCep('Informe um CEP com 8 digitos.');
      return;
    }

    setConsultandoCep(true);
    setErroCep(null);

    try {
      const endereco = await cepsServico.consultar(cep);

      setCampos((estadoAtual) => ({
        ...estadoAtual,
        enderecoCep: endereco.cep,
        enderecoRua: endereco.rua || estadoAtual.enderecoRua,
        enderecoBairro: endereco.bairro || estadoAtual.enderecoBairro,
        enderecoCidade: endereco.cidade || estadoAtual.enderecoCidade,
        enderecoEstado: endereco.uf || estadoAtual.enderecoEstado,
      }));
      setCepConsultado(cep);
    } catch (erroConsulta) {
      const erroApi = erroConsulta as ErroApi;
      setErroCep(erroApi.mensagem ?? 'Nao foi possivel consultar o CEP.');
      setCepConsultado('');
    } finally {
      setConsultandoCep(false);
    }
  }

  function montarComplemento() {
    const bairro = campos.enderecoBairro.trim();
    const complemento = campos.enderecoComplemento.trim();

    if (bairro && complemento) {
      return `Bairro: ${bairro}. ${complemento}`;
    }

    if (bairro) {
      return `Bairro: ${bairro}`;
    }

    return complemento;
  }

  function validarFormulario() {
    const camposObrigatorios: Array<keyof CamposCadastro> = [
      'nome',
      'cpf',
      'email',
      'telefone',
      'dataNascimento',
      'enderecoRua',
      'enderecoEstado',
      'enderecoCidade',
      'enderecoCep',
      'senha',
      'confirmarSenha',
    ];

    const campoVazio = camposObrigatorios.find((campo) => !campos[campo].trim());

    if (campoVazio) {
      return 'Preencha todos os campos obrigatorios.';
    }

    if (!campos.email.includes('@')) {
      return 'Informe um email valido.';
    }

    if (!dataBrValida(campos.dataNascimento)) {
      return 'Informe a data de nascimento no formato DD/MM/AAAA.';
    }

    if (campos.senha.length < 8) {
      return 'A senha precisa ter pelo menos 8 caracteres.';
    }

    if (campos.senha !== campos.confirmarSenha) {
      return 'A confirmacao de senha precisa ser igual a senha.';
    }

    return null;
  }

  async function cadastrarResponsavel() {
    setErro(null);

    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setEnviando(true);

    try {
      if (!dataBrValida(campos.dataNascimento)) {
        setErro('Informe a data de nascimento no formato DD/MM/AAAA.');
        return;
      }

      await usuariosServico.criar({
        nome: campos.nome.trim(),
        cpf: campos.cpf.trim(),
        email: campos.email.trim().toLowerCase(),
        telefone: campos.telefone.trim(),
        dataNascimento: campos.dataNascimento.trim(),
        enderecoRua: campos.enderecoRua.trim(),
        enderecoEstado: campos.enderecoEstado.trim().toUpperCase(),
        enderecoCidade: campos.enderecoCidade.trim(),
        enderecoCep: campos.enderecoCep.trim(),
        enderecoComplemento: montarComplemento(),
        senha: campos.senha,
        confirmarSenha: campos.confirmarSenha,
        tipo: 'responsavel',
        recebeNotificacoes: true,
      });

      setCampos(camposIniciais);
      router.replace('/login');
    } catch (erroCadastro) {
      const erroApi = erroCadastro as ErroApi;
      setErro(erroApi.mensagem ?? 'Nao foi possivel criar a conta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <CabecalhoTela
        titulo="Criar conta"
        subtitulo="Cadastre o responsavel que vai acompanhar pacientes, horarios e alertas."
      />

      <View style={styles.formulario}>
        <CampoTexto
          label="Nome completo"
          onChangeText={(valor) => atualizarCampo('nome', valor)}
          placeholder="Maria Responsavel"
          value={campos.nome}
        />
        <CampoTexto
          keyboardType="number-pad"
          label="CPF"
          onChangeText={(valor) => atualizarCampo('cpf', valor)}
          placeholder="Somente numeros"
          value={campos.cpf}
        />
        <CampoTexto
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={(valor) => atualizarCampo('email', valor)}
          placeholder="maria@email.com"
          value={campos.email}
        />
        <CampoTexto
          keyboardType="phone-pad"
          label="Telefone"
          onChangeText={(valor) => atualizarCampo('telefone', valor)}
          placeholder="11999999999"
          value={campos.telefone}
        />
        <CampoTexto
          keyboardType="number-pad"
          label="Data de nascimento"
          onChangeText={(valor) => atualizarCampo('dataNascimento', valor)}
          placeholder="DD/MM/AAAA"
          value={campos.dataNascimento}
        />
        <CampoTexto
          keyboardType="number-pad"
          label="CEP"
          onChangeText={(valor) => atualizarCampo('enderecoCep', valor)}
          placeholder="01001000"
          value={campos.enderecoCep}
        />
        {erroCep ? <EstadoErro mensagem={erroCep} titulo="CEP nao preenchido" /> : null}
        <Botao
          carregando={consultandoCep}
          titulo="Buscar CEP"
          variante="secundario"
          onPress={() => consultarCep()}
        />
        <CampoTexto
          label="Rua"
          onChangeText={(valor) => atualizarCampo('enderecoRua', valor)}
          placeholder="Rua das Flores"
          value={campos.enderecoRua}
        />
        <CampoTexto
          label="Bairro"
          onChangeText={(valor) => atualizarCampo('enderecoBairro', valor)}
          placeholder="Centro"
          value={campos.enderecoBairro}
        />
        <View style={styles.linha}>
          <CampoTexto
            containerStyle={styles.campoMaior}
            label="Cidade"
            onChangeText={(valor) => atualizarCampo('enderecoCidade', valor)}
            placeholder="Sao Paulo"
            value={campos.enderecoCidade}
          />
          <CampoTexto
            autoCapitalize="characters"
            containerStyle={styles.campoMenor}
            label="UF"
            maxLength={2}
            onChangeText={(valor) => atualizarCampo('enderecoEstado', valor)}
            placeholder="SP"
            value={campos.enderecoEstado}
          />
        </View>
        <CampoTexto
          label="Complemento"
          onChangeText={(valor) => atualizarCampo('enderecoComplemento', valor)}
          placeholder="Casa, apartamento, bloco..."
          value={campos.enderecoComplemento}
        />
        <CampoTexto
          label="Senha"
          onChangeText={(valor) => atualizarCampo('senha', valor)}
          placeholder="Crie uma senha"
          secureTextEntry
          value={campos.senha}
        />
        <CampoTexto
          label="Confirmar senha"
          onChangeText={(valor) => atualizarCampo('confirmarSenha', valor)}
          placeholder="Repita a senha"
          secureTextEntry
          value={campos.confirmarSenha}
        />
      </View>

      {erro ? <EstadoErro mensagem={erro} titulo="Cadastro nao concluido" /> : null}

      <Botao
        carregando={enviando}
        titulo="Cadastrar responsavel"
        onPress={cadastrarResponsavel}
      />
      <Botao titulo="Ja tenho conta" variante="fantasma" onPress={() => router.back()} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  formulario: {
    gap: tema.espacamentos.lg,
  },
  linha: {
    flexDirection: 'row',
    gap: tema.espacamentos.md,
  },
  campoMenor: {
    minWidth: 78,
  },
  campoMaior: {
    flex: 1,
  },
});
