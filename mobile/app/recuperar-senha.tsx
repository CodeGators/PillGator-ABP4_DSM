import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/src/componentes/base/Botao';
import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { CampoTexto } from '@/src/componentes/base/CampoTexto';
import { Cartao } from '@/src/componentes/base/Cartao';
import { Tela } from '@/src/componentes/base/Tela';
import { tema } from '@/src/config/tema';
import { autenticacaoServico } from '@/src/servicos/autenticacaoServico';
import type { ErroApi } from '@/src/tipos/api';

export default function RecuperarSenhaScreen() {
  const [identificador, setIdentificador] = useState('');
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function solicitarRecuperacao() {
    setErroModal(null);

    if (!identificador.trim()) {
      setErroModal('Digite o email ou CPF cadastrado.');
      return;
    }

    setEnviando(true);

    try {
      const resposta = await autenticacaoServico.solicitarRecuperacaoSenha({
        identificador: normalizarIdentificador(identificador),
      });

      router.push({
        pathname: '/redefinir-senha',
        params: { identificador: resposta.identificador },
      });
    } catch (erroRecuperacao) {
      const erroApi = erroRecuperacao as ErroApi;
      setErroModal(erroApi.mensagem ?? 'CPF ou email nao cadastrado.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <CabecalhoTela
        titulo="Recuperar senha"
        subtitulo="Digite o email ou CPF cadastrado para criar uma nova senha."
      />

      <View style={styles.formulario}>
        <CampoTexto
          autoCapitalize="none"
          label="Email ou CPF"
          onChangeText={setIdentificador}
          placeholder="responsavel@email.com ou 00000000000"
          value={identificador}
        />

        <Botao
          carregando={enviando}
          titulo="Continuar"
          onPress={solicitarRecuperacao}
        />
        <Botao titulo="Voltar ao login" variante="fantasma" onPress={() => router.back()} />
      </View>

      <Modal animationType="fade" transparent visible={Boolean(erroModal)}>
        <View style={styles.modalFundo}>
          <Cartao destaque="perigo" style={styles.modalConteudo}>
            <Text style={styles.modalTitulo}>Cadastro nao encontrado</Text>
            <Text style={styles.mensagem}>
              {erroModal}
            </Text>
            <Botao titulo="Entendi" onPress={() => setErroModal(null)} />
          </Cartao>
        </View>
      </Modal>
    </Tela>
  );
}

function normalizarIdentificador(valor: string) {
  const identificador = valor.trim();

  if (identificador.includes('@')) {
    return identificador.toLowerCase();
  }

  return identificador.replace(/\D/g, '');
}

const styles = StyleSheet.create({
  formulario: {
    gap: tema.espacamentos.lg,
  },
  modalFundo: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: tema.espacamentos.xl,
  },
  modalConteudo: {
    gap: tema.espacamentos.lg,
    width: '100%',
  },
  modalTitulo: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.subtitulo,
    fontWeight: '900',
  },
  mensagem: {
    color: tema.cores.texto,
    fontSize: tema.tipografia.corpo,
    lineHeight: 23,
  },
});
