import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { autenticacaoServico } from '@/src/servicos/autenticacaoServico';
import { carregarSessao, limparSessao, salvarSessao } from '@/src/servicos/armazenamentoSessao';
import {
  definirTokenAtual,
  definirTratadorSessaoExpirada,
} from '@/src/servicos/sessaoToken';
import type {
  LoginEntrada,
  LoginResposta,
  UsuarioAutenticado,
} from '@/src/tipos/autenticacao';

type AutenticacaoContextoValor = {
  usuario: UsuarioAutenticado | null;
  token: string | null;
  carregandoSessao: boolean;
  entrando: boolean;
  entrar: (entrada: LoginEntrada) => Promise<void>;
  sair: () => Promise<void>;
};

export const AutenticacaoContexto = createContext<AutenticacaoContextoValor | null>(null);

export function AutenticacaoProvider({ children }: PropsWithChildren) {
  const [sessao, setSessao] = useState<LoginResposta | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const queryClient = useQueryClient();

  const sair = useCallback(async () => {
    definirTokenAtual(null);
    setSessao(null);
    queryClient.clear();
    await limparSessao();
  }, [queryClient]);

  useEffect(() => {
    let ativo = true;

    async function recuperarSessao() {
      try {
        const sessaoSalva = await carregarSessao();

        if (!ativo) {
          return;
        }

        definirTokenAtual(sessaoSalva?.token ?? null);

        if (!sessaoSalva) {
          setSessao(null);
          return;
        }

        try {
          const usuarioAtualizado = await autenticacaoServico.me();
          const sessaoAtualizada = {
            ...sessaoSalva,
            usuario: usuarioAtualizado,
          };

          if (!ativo) {
            return;
          }

          setSessao(sessaoAtualizada);
          await salvarSessao(sessaoAtualizada);
        } catch {
          setSessao(sessaoSalva);
        }
      } finally {
        if (ativo) {
          setCarregandoSessao(false);
        }
      }
    }

    recuperarSessao();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    definirTratadorSessaoExpirada(() => {
      void sair();
    });

    return () => definirTratadorSessaoExpirada(null);
  }, [sair]);

  const entrar = useCallback(async (entrada: LoginEntrada) => {
    setEntrando(true);

    try {
      const novaSessao = await autenticacaoServico.login(entrada);
      definirTokenAtual(novaSessao.token);
      setSessao(novaSessao);
      await salvarSessao(novaSessao);
    } finally {
      setEntrando(false);
    }
  }, []);

  const valor = useMemo(
    () => ({
      usuario: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      carregandoSessao,
      entrando,
      entrar,
      sair,
    }),
    [carregandoSessao, entrando, entrar, sair, sessao]
  );

  return (
    <AutenticacaoContexto.Provider value={valor}>
      {children}
    </AutenticacaoContexto.Provider>
  );
}
