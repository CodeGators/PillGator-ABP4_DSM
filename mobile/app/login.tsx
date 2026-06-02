import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/src/componentes/base/Botao';
import { CampoTexto } from '@/src/componentes/base/CampoTexto';
import { EstadoErro } from '@/src/componentes/base/EstadoErro';
import { Tela } from '@/src/componentes/base/Tela';
import { tema } from '@/src/config/tema';
import { useAutenticacao } from '@/src/hooks/useAutenticacao';
import type { ErroApi } from '@/src/tipos/api';

export default function LoginScreen() {
  const { carregandoSessao, entrando, entrar, token } = useAutenticacao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  if (!carregandoSessao && token) {
    return <Redirect href="/(app)/inicio" />;
  }

  async function acessarPainel() {
    setErro(null);

    try {
      await entrar({ email: email.trim(), senha });
      router.replace('/(app)/inicio');
    } catch (erroLogin) {
      const erroApi = erroLogin as ErroApi;
      setErro(erroApi.mensagem ?? 'Nao foi possivel acessar o painel.');
    }
  }

  return (
    <Tela semScroll>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.logoTexto}>PG</Text>
        </View>

        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>PillGator</Text>
          <Text style={styles.subtitulo}>Sistema de gestao de medicamentos</Text>
        </View>

        <View style={styles.formulario}>
          <CampoTexto
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="responsavel@email.com"
            value={email}
          />
          <CampoTexto
            label="Senha"
            onChangeText={setSenha}
            placeholder="Sua senha"
            secureTextEntry
            value={senha}
          />
          {erro ? <EstadoErro mensagem={erro} titulo="Nao foi possivel entrar" /> : null}
          <Botao carregando={entrando} titulo="Acessar painel" onPress={acessarPainel} />
          <Botao
            titulo="Criar conta"
            variante="fantasma"
            onPress={() => router.push('/cadastro')}
          />
          <Botao
            titulo="Esqueci minha senha"
            variante="fantasma"
            onPress={() => router.push('/recuperar-senha')}
          />
        </View>
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: tema.cores.primaria,
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    marginBottom: tema.espacamentos.xl,
    width: 84,
  },
  logoTexto: {
    color: tema.cores.preto,
    fontSize: 34,
    fontWeight: '900',
  },
  cabecalho: {
    alignItems: 'center',
    gap: tema.espacamentos.sm,
    marginBottom: tema.espacamentos.xxl,
  },
  titulo: {
    color: tema.cores.texto,
    fontSize: 38,
    fontWeight: '900',
  },
  subtitulo: {
    color: tema.cores.primaria,
    fontSize: tema.tipografia.apoio,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  formulario: {
    gap: tema.espacamentos.lg,
  },
});
