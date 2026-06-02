import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Botao } from '@/src/componentes/base/Botao';
import { CabecalhoTela } from '@/src/componentes/base/CabecalhoTela';
import { CampoTexto } from '@/src/componentes/base/CampoTexto';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { Tela } from '@/src/componentes/base/Tela';
import { tema } from '@/src/config/tema';
import { autenticacaoServico } from '@/src/servicos/autenticacaoServico';
import type { ErroApi } from '@/src/tipos/api';

export default function RedefinirSenhaScreen() {
  const params = useLocalSearchParams<{ identificador?: string }>();
  const identificador = params.identificador ?? '';
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function redefinirSenha() {
    setErro(null);

    if (!identificador.trim()) {
      setErro('Volte e informe o email ou CPF cadastrado.');
      return;
    }

    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('A confirmacao de senha precisa ser igual a senha.');
      return;
    }

    setEnviando(true);

    try {
      await autenticacaoServico.redefinirSenha({
        identificador,
        senha,
        confirmarSenha,
      });

      router.replace('/login');
    } catch (erroRedefinicao) {
      const erroApi = erroRedefinicao as ErroApi;
      setErro(erroApi.mensagem ?? 'Nao foi possivel redefinir a senha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <CabecalhoTela
        titulo="Nova senha"
        subtitulo="Escolha uma nova senha para a conta localizada."
      />

      <View style={styles.formulario}>
        <CampoTexto
          autoCapitalize="none"
          editable={false}
          label="Conta"
          onChangeText={() => undefined}
          value={identificador}
        />
        <CampoTexto
          label="Nova senha"
          onChangeText={setSenha}
          placeholder="Digite a nova senha"
          secureTextEntry
          value={senha}
        />
        <CampoTexto
          label="Confirmar nova senha"
          onChangeText={setConfirmarSenha}
          placeholder="Repita a nova senha"
          secureTextEntry
          value={confirmarSenha}
        />

        {erro ? <EstadoErro mensagem={erro} titulo="Senha nao redefinida" /> : null}

        <Botao carregando={enviando} titulo="Salvar nova senha" onPress={redefinirSenha} />
        <Botao titulo="Voltar ao login" variante="fantasma" onPress={() => router.replace('/login')} />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  formulario: {
    gap: tema.espacamentos.lg,
  },
});
