import type { Repository } from 'typeorm';

import { Usuario } from '../src/entidades/Usuario.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { UsuariosServico } from '../src/modulos/usuarios/usuariosServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioUsuariosMemoria {
  public usuarios: Usuario[] = [];

  public create(dados: Partial<Usuario>): Usuario {
    return Object.assign(new Usuario(), {
      id: `usuario-${this.usuarios.length + 1}`,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(usuario: Usuario): Promise<Usuario> {
    const indice = this.usuarios.findIndex((item) => item.id === usuario.id);

    if (indice >= 0) {
      this.usuarios[indice] = usuario;
    } else {
      this.usuarios.push(usuario);
    }

    return usuario;
  }

  public async find(opcoes: { where: Partial<Usuario> }): Promise<Usuario[]> {
    return this.usuarios.filter((usuario) => {
      if (opcoes.where.ativo !== undefined && usuario.ativo !== opcoes.where.ativo) {
        return false;
      }

      if (opcoes.where.tipo !== undefined && usuario.tipo !== opcoes.where.tipo) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<Usuario>;
  }): Promise<Usuario | null> {
    return (
      this.usuarios.find((usuario) => {
        if (opcoes.where.id !== undefined && usuario.id !== opcoes.where.id) {
          return false;
        }

        if (
          opcoes.where.email !== undefined &&
          usuario.email !== opcoes.where.email
        ) {
          return false;
        }

        if (opcoes.where.cpf !== undefined && usuario.cpf !== opcoes.where.cpf) {
          return false;
        }

        if (
          opcoes.where.ativo !== undefined &&
          usuario.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

function criarServico() {
  const usuariosRepositorio = new RepositorioUsuariosMemoria();
  const servico = new UsuariosServico(
    usuariosRepositorio as unknown as Repository<Usuario>
  );

  return { servico, usuariosRepositorio };
}

function criarEntradaUsuario(
  sobrescritas: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    nome: 'Maria Responsavel',
    cpf: '935.411.347-80',
    email: 'maria@example.com',
    telefone: '11999999999',
    dataNascimento: '1990-05-20',
    enderecoRua: 'Rua das Flores',
    enderecoEstado: 'sp',
    enderecoCidade: 'Jacarei',
    enderecoCep: '12345-678',
    enderecoComplemento: 'Casa 2',
    senha: 'senha-segura',
    confirmarSenha: 'senha-segura',
    tipo: 'responsavel',
    recebeNotificacoes: true,
    ...sobrescritas
  };
}

describe('UsuariosServico', () => {
  it('deve criar usuario normalizando dados cadastrais', async () => {
    const { servico } = criarServico();

    const usuario = await servico.criar(criarEntradaUsuario({
      nome: ' Maria Responsavel ',
      email: ' MARIA@EXAMPLE.COM ',
      telefone: ' 11999999999 ',
      enderecoEstado: 'sp'
    }));

    expect(usuario).toMatchObject({
      nome: 'Maria Responsavel',
      cpf: '93541134780',
      email: 'maria@example.com',
      telefone: '11999999999',
      dataNascimento: '1990-05-20',
      enderecoRua: 'Rua das Flores',
      enderecoEstado: 'SP',
      enderecoCidade: 'Jacarei',
      enderecoCep: '12345678',
      enderecoComplemento: 'Casa 2',
      tipo: 'responsavel',
      recebeNotificacoes: true,
      ativo: true
    });
  });

  it('deve aceitar data de nascimento em formato brasileiro', async () => {
    const { servico } = criarServico();

    const usuario = await servico.criar(
      criarEntradaUsuario({ dataNascimento: '20/05/1990' })
    );

    expect(usuario.dataNascimento).toBe('1990-05-20');
  });

  it('deve rejeitar email duplicado', async () => {
    const { servico } = criarServico();

    await servico.criar({
      ...criarEntradaUsuario(),
      nome: 'Maria',
      email: 'maria@example.com'
    });

    await expect(
      servico.criar({
        ...criarEntradaUsuario({
          cpf: '52998224725',
          email: 'maria@example.com'
        }),
        nome: 'Outra Maria'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 409,
      message: 'Email ja cadastrado'
    });
  });

  it('deve rejeitar cpf duplicado', async () => {
    const { servico } = criarServico();

    await servico.criar(criarEntradaUsuario());

    await expect(
      servico.criar(
        criarEntradaUsuario({
          email: 'outra.maria@example.com'
        })
      )
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 409,
      message: 'CPF ja cadastrado'
    });
  });

  it('deve rejeitar confirmacao de senha diferente', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar(
        criarEntradaUsuario({
          confirmarSenha: 'senha-diferente'
        })
      )
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Campo confirmarSenha deve ser igual a senha'
    });
  });

  it('deve listar apenas usuarios ativos e filtrar por tipo', async () => {
    const { servico } = criarServico();

    await servico.criar({
      ...criarEntradaUsuario(),
      nome: 'Maria',
      email: 'maria@example.com'
    });
    const administrador = await servico.criar({
      ...criarEntradaUsuario({
        cpf: '52998224725',
        email: 'admin@example.com',
        tipo: 'administrador'
      }),
      nome: 'Admin',
      tipo: 'administrador'
    });
    await servico.remover(administrador.id);

    const usuarios = await servico.listar({ tipo: 'responsavel' });

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0]?.tipo).toBe('responsavel');
  });

  it('deve atualizar usuario existente', async () => {
    const { servico } = criarServico();
    const usuario = await servico.criar(criarEntradaUsuario());

    const atualizado = await servico.atualizar(usuario.id, {
      nome: 'Maria Silva',
      telefone: '',
      enderecoCep: '87654-321'
    });

    expect(atualizado).toMatchObject({
      nome: 'Maria Silva',
      telefone: null,
      enderecoCep: '87654321'
    });
  });

  it('deve rejeitar tipo invalido', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        ...criarEntradaUsuario(),
        tipo: 'cuidador'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400
    });
  });

  it('deve rejeitar cadastro de paciente em usuarios', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        ...criarEntradaUsuario(),
        nome: 'Joao Paciente',
        email: 'joao@example.com',
        tipo: 'paciente'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Campo tipo deve ser um destes valores: responsavel, administrador'
    });
  });
});
