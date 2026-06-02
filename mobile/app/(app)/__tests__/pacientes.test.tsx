import { screen, waitFor } from '@testing-library/react-native';

import PacientesScreen from '../pacientes';
import { useAutenticacao } from '@/src/hooks/useAutenticacao';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { pacientesServico } from '@/src/servicos/pacientesServico';
import { renderComQueryClient } from '@/src/testes/renderComQueryClient';

jest.mock('@/src/hooks/useAutenticacao');
jest.mock('@/src/hooks/usePacienteSelecionado');
jest.mock('@/src/servicos/pacientesServico', () => ({
  pacientesServico: {
    atualizar: jest.fn(),
    criar: jest.fn(),
    listarMeus: jest.fn(),
    remover: jest.fn(),
  },
}));

const useAutenticacaoMock = jest.mocked(useAutenticacao);
const usePacienteSelecionadoMock = jest.mocked(usePacienteSelecionado);
const pacientesServicoMock = jest.mocked(pacientesServico);

describe('pacientes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAutenticacaoMock.mockReturnValue({
      carregandoSessao: false,
      entrando: false,
      entrar: jest.fn(),
      sair: jest.fn(),
      token: 'token',
      usuario: {
        id: 'usuario-1',
        nome: 'Maria',
        email: 'maria@email.com',
        dataNascimento: '01/10/1983',
        tipo: 'responsavel',
      },
    });
    usePacienteSelecionadoMock.mockReturnValue({
      carregandoPacienteSelecionado: false,
      pacienteSelecionado: null,
      pacienteSelecionadoIdSalvo: null,
      selecionarPaciente: jest.fn(),
    });
  });

  it('mantem acao de cadastro sem exibir card vazio quando nao ha pacientes', async () => {
    pacientesServicoMock.listarMeus.mockResolvedValue([]);

    renderComQueryClient(<PacientesScreen />);

    await waitFor(() => {
      expect(pacientesServicoMock.listarMeus).toHaveBeenCalled();
    });

    expect(screen.queryByText('Nenhum paciente cadastrado')).toBeNull();
    expect(screen.getByRole('button', { name: 'Novo' })).toBeTruthy();
  });
});
