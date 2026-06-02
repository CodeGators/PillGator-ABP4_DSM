import { fireEvent, render, screen } from '@testing-library/react-native';

import { Botao } from '../Botao';
import { CampoTexto } from '../CampoTexto';
import { EstadoVazio } from '../EstadoVazio';

describe('componentes base', () => {
  it('executa a acao do botao', () => {
    const onPress = jest.fn();

    render(<Botao titulo="Salvar" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exibe label e erro do campo de texto', () => {
    render(<CampoTexto label="Email" erro="Email obrigatorio" value="" />);

    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Email obrigatorio')).toBeTruthy();
  });

  it('mostra estado vazio com acao opcional', () => {
    const onAcao = jest.fn();

    render(
      <EstadoVazio
        titulo="Nada encontrado"
        mensagem="Cadastre um item para continuar."
        acaoTexto="Cadastrar"
        onAcao={onAcao}
      />
    );

    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('Nada encontrado')).toBeTruthy();
    expect(onAcao).toHaveBeenCalledTimes(1);
  });
});
