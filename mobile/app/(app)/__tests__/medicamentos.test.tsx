import { screen } from '@testing-library/react-native';

import MedicamentosScreen from '../medicamentos';
import { usePacienteSelecionado } from '@/src/hooks/usePacienteSelecionado';
import { baseMedicamentosServico } from '@/src/servicos/baseMedicamentosServico';
import { medicamentosServico } from '@/src/servicos/medicamentosServico';
import { renderComQueryClient } from '@/src/testes/renderComQueryClient';

jest.mock('@/src/hooks/usePacienteSelecionado');
jest.mock('@/src/servicos/baseMedicamentosServico', () => ({
  baseMedicamentosServico: {
    listar: jest.fn(),
  },
}));
jest.mock('@/src/servicos/medicamentosServico', () => ({
  medicamentosServico: {
    atualizar: jest.fn(),
    criar: jest.fn(),
    listar: jest.fn(),
    remover: jest.fn(),
  },
}));

const usePacienteSelecionadoMock = jest.mocked(usePacienteSelecionado);
const baseMedicamentosServicoMock = jest.mocked(baseMedicamentosServico);
const medicamentosServicoMock = jest.mocked(medicamentosServico);

describe('medicamentos', () => {
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
    baseMedicamentosServicoMock.listar.mockResolvedValue([]);
  });

  it('lista medicamentos do paciente selecionado', async () => {
    medicamentosServicoMock.listar.mockResolvedValue([
      {
        ativo: true,
        atualizadoEm: '',
        baseMedicamentoId: null,
        criadoEm: '',
        dosagem: '50mg',
        id: 'med-1',
        nome: 'Losartana',
        observacoes: 'Tomar com agua',
        pacienteId: 'paciente-1',
        quantidadeAdministrada: '1',
        unidadeAdministracao: 'comprimido',
      },
    ]);

    renderComQueryClient(<MedicamentosScreen />);

    expect(await screen.findByText('Losartana')).toBeTruthy();
    expect(screen.getByText('50mg')).toBeTruthy();
  });
});
