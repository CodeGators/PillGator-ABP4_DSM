import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import AgendaScreen from '../agenda';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { agendamentosServico } from '@/src/servicos/agendamentosServico';
import { medicamentosServico } from '@/src/servicos/medicamentosServico';
import { renderComQueryClient } from '@/src/testes/renderComQueryClient';

jest.mock('@/src/hooks/usePacienteSelecionado');
jest.mock('@/src/servicos/agendamentosServico', () => ({
  agendamentosServico: {
    atualizar: jest.fn(),
    criar: jest.fn(),
    listar: jest.fn(),
    listarProximasAdministracoes: jest.fn(),
    remover: jest.fn(),
  },
}));
jest.mock('@/src/servicos/medicamentosServico', () => ({
  medicamentosServico: {
    listar: jest.fn(),
  },
}));

const usePacienteSelecionadoMock = jest.mocked(usePacienteSelecionado);
const agendamentosServicoMock = jest.mocked(agendamentosServico);
const medicamentosServicoMock = jest.mocked(medicamentosServico);

describe('agenda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePacienteSelecionadoMock.mockReturnValue({
      carregandoPacienteSelecionado: false,
      pacienteSelecionado: {
        ativo: true,
        criadoEm: '',
        atualizadoEm: '',
        dataNascimento: null,
        id: 'paciente-1',
        nome: 'Tchalla',
        observacoes: null,
        usuarioId: null,
      },
      pacienteSelecionadoIdSalvo: 'paciente-1',
      selecionarPaciente: jest.fn(),
    });
    agendamentosServicoMock.listar.mockResolvedValue([]);
    agendamentosServicoMock.listarProximasAdministracoes.mockResolvedValue([]);
    medicamentosServicoMock.listar.mockResolvedValue([
      {
        ativo: true,
        atualizadoEm: '',
        baseMedicamentoId: null,
        criadoEm: '',
        dosagem: '50mg',
        id: 'med-1',
        nome: 'Losartana',
        observacoes: null,
        pacienteId: 'paciente-1',
        quantidadeAdministrada: '1',
        unidadeAdministracao: 'comprimido',
      },
    ]);
  });

  it('abre selecao de medicamento antes do formulario de agendamento', async () => {
    renderComQueryClient(<AgendaScreen />);

    await waitFor(() => {
      expect(agendamentosServicoMock.listar).toHaveBeenCalled();
      expect(medicamentosServicoMock.listar).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByRole('button', { name: 'Novo' }));

    expect(await screen.findByText('Selecionar medicamento')).toBeTruthy();
    fireEvent.press(screen.getByText('Losartana'));
    fireEvent.press(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(screen.getByText('Novo agendamento')).toBeTruthy();
      expect(screen.getByText('Horarios')).toBeTruthy();
    });
  });
});
