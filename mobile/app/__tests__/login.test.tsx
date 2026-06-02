import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import LoginScreen from '../login';
import { useAutenticacao } from '@/src/hooks/useAutenticacao';

jest.mock('expo-router', () => ({
  Redirect: () => null,
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@/src/hooks/useAutenticacao');

const useAutenticacaoMock = jest.mocked(useAutenticacao);
const routerMock = jest.mocked(router);

describe('login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('faz login com sucesso e navega para o inicio', async () => {
    const entrar = jest.fn().mockResolvedValue(undefined);

    useAutenticacaoMock.mockReturnValue({
      carregandoSessao: false,
      entrando: false,
      entrar,
      sair: jest.fn(),
      token: null,
      usuario: null,
    });

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), ' aa@aa.com ');
    fireEvent.changeText(screen.getByLabelText('Senha'), '12345678');
    fireEvent.press(screen.getByRole('button', { name: 'Acessar painel' }));

    await waitFor(() => {
      expect(entrar).toHaveBeenCalledWith({
        email: 'aa@aa.com',
        senha: '12345678',
      });
      expect(routerMock.replace).toHaveBeenCalledWith('/(app)/inicio');
    });
  });

  it('mostra erro quando credenciais sao recusadas', async () => {
    useAutenticacaoMock.mockReturnValue({
      carregandoSessao: false,
      entrando: false,
      entrar: jest.fn().mockRejectedValue({ mensagem: 'Credenciais invalidas' }),
      sair: jest.fn(),
      token: null,
      usuario: null,
    });

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'aa@aa.com');
    fireEvent.changeText(screen.getByLabelText('Senha'), 'senha-errada');
    fireEvent.press(screen.getByRole('button', { name: 'Acessar painel' }));

    expect(await screen.findByText('Credenciais invalidas')).toBeTruthy();
  });
});
