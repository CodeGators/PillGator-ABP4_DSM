import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAutenticacao } from '@/src/hooks/useAutenticacao';
import {
  carregarPacienteSelecionadoId,
  limparPacienteSelecionadoId,
  salvarPacienteSelecionadoId,
} from '@/src/servicos/armazenamentoPacienteSelecionado';
import type { Paciente } from '@/src/tipos/paciente';

type PacienteSelecionadoContextoValor = {
  pacienteSelecionado: Paciente | null;
  pacienteSelecionadoIdSalvo: string | null;
  carregandoPacienteSelecionado: boolean;
  selecionarPaciente: (paciente: Paciente | null) => void;
};

export const PacienteSelecionadoContexto =
  createContext<PacienteSelecionadoContextoValor | null>(null);

export function PacienteSelecionadoProvider({ children }: PropsWithChildren) {
  const { usuario } = useAutenticacao();
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [pacienteSelecionadoIdSalvo, setPacienteSelecionadoIdSalvo] = useState<string | null>(null);
  const [carregandoPacienteSelecionado, setCarregandoPacienteSelecionado] = useState(false);

  const selecionarPaciente = useCallback((paciente: Paciente | null) => {
    setPacienteSelecionado(paciente);
    setPacienteSelecionadoIdSalvo(paciente?.id ?? null);

    if (!usuario?.id) {
      return;
    }

    if (paciente) {
      void salvarPacienteSelecionadoId(usuario.id, paciente.id);
      return;
    }

    void limparPacienteSelecionadoId(usuario.id);
  }, [usuario?.id]);

  useEffect(() => {
    let ativo = true;

    async function carregarPacientePadrao() {
      if (!usuario?.id) {
        setPacienteSelecionado(null);
        setPacienteSelecionadoIdSalvo(null);
        setCarregandoPacienteSelecionado(false);
        return;
      }

      setCarregandoPacienteSelecionado(true);

      try {
        const pacienteId = await carregarPacienteSelecionadoId(usuario.id);

        if (!ativo) {
          return;
        }

        setPacienteSelecionado(null);
        setPacienteSelecionadoIdSalvo(pacienteId);
      } finally {
        if (ativo) {
          setCarregandoPacienteSelecionado(false);
        }
      }
    }

    void carregarPacientePadrao();

    return () => {
      ativo = false;
    };
  }, [usuario?.id]);

  const valor = useMemo(
    () => ({
      pacienteSelecionado,
      pacienteSelecionadoIdSalvo,
      carregandoPacienteSelecionado,
      selecionarPaciente,
    }),
    [
      carregandoPacienteSelecionado,
      pacienteSelecionado,
      pacienteSelecionadoIdSalvo,
      selecionarPaciente,
    ]
  );

  return (
    <PacienteSelecionadoContexto.Provider value={valor}>
      {children}
    </PacienteSelecionadoContexto.Provider>
  );
}
