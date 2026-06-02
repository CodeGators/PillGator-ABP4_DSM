import type { Repository } from 'typeorm';

import { Paciente } from '../src/entidades/Paciente.js';
import { PacienteResponsavel } from '../src/entidades/PacienteResponsavel.js';
import { Usuario } from '../src/entidades/Usuario.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { PacientesServico } from '../src/modulos/pacientes/pacientesServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioPacientesMemoria {
  public pacientes: Paciente[] = [];

  public create(dados: Partial<Paciente>): Paciente {
    return Object.assign(new Paciente(), {
      id: `paciente-${this.pacientes.length + 1}`,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(paciente: Paciente): Promise<Paciente> {
    const indice = this.pacientes.findIndex((item) => item.id === paciente.id);

    if (indice >= 0) {
      this.pacientes[indice] = paciente;
    } else {
      this.pacientes.push(paciente);
    }

    return paciente;
  }

  public async find(opcoes: { where: Partial<Paciente> }): Promise<Paciente[]> {
    return this.pacientes.filter((paciente) => {
      if (opcoes.where.ativo !== undefined && paciente.ativo !== opcoes.where.ativo) {
        return false;
      }

      if (
        opcoes.where.usuarioId !== undefined &&
        paciente.usuarioId !== opcoes.where.usuarioId
      ) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<Paciente>;
  }): Promise<Paciente | null> {
    return (
      this.pacientes.find((paciente) => {
        if (opcoes.where.id !== undefined && paciente.id !== opcoes.where.id) {
          return false;
        }

        if (
          opcoes.where.usuarioId !== undefined &&
          paciente.usuarioId !== opcoes.where.usuarioId
        ) {
          return false;
        }

        if (
          opcoes.where.ativo !== undefined &&
          paciente.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

class RepositorioUsuariosMemoria {
  public usuarios: Usuario[] = [];

  public async findOne(opcoes: {
    where: Partial<Usuario>;
  }): Promise<Usuario | null> {
    return (
      this.usuarios.find((usuario) => {
        if (opcoes.where.id !== undefined && usuario.id !== opcoes.where.id) {
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

class RepositorioPacientesResponsaveisMemoria {
  public vinculos: PacienteResponsavel[] = [];

  public create(dados: Partial<PacienteResponsavel>): PacienteResponsavel {
    return Object.assign(new PacienteResponsavel(), {
      id: `vinculo-${this.vinculos.length + 1}`,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(
    vinculo: PacienteResponsavel
  ): Promise<PacienteResponsavel> {
    const indice = this.vinculos.findIndex((item) => item.id === vinculo.id);

    if (indice >= 0) {
      this.vinculos[indice] = vinculo;
    } else {
      this.vinculos.push(vinculo);
    }

    return vinculo;
  }

  public async find(opcoes: {
    where: Partial<PacienteResponsavel>;
  }): Promise<PacienteResponsavel[]> {
    return this.vinculos.filter((vinculo) => {
      if (
        opcoes.where.pacienteId !== undefined &&
        vinculo.pacienteId !== opcoes.where.pacienteId
      ) {
        return false;
      }

      if (
        opcoes.where.responsavelId !== undefined &&
        vinculo.responsavelId !== opcoes.where.responsavelId
      ) {
        return false;
      }

      if (opcoes.where.ativo !== undefined && vinculo.ativo !== opcoes.where.ativo) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<PacienteResponsavel>;
  }): Promise<PacienteResponsavel | null> {
    return (
      this.vinculos.find((vinculo) => {
        if (
          opcoes.where.pacienteId !== undefined &&
          vinculo.pacienteId !== opcoes.where.pacienteId
        ) {
          return false;
        }

        if (
          opcoes.where.responsavelId !== undefined &&
          vinculo.responsavelId !== opcoes.where.responsavelId
        ) {
          return false;
        }

        if (opcoes.where.ativo !== undefined && vinculo.ativo !== opcoes.where.ativo) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

function criarUsuario(sobrescritas: Partial<Usuario> = {}): Usuario {
  return Object.assign(new Usuario(), {
    id: 'responsavel-1',
    nome: 'Maria Responsavel',
    email: 'maria@example.com',
    dataNascimento: '1990-05-20',
    telefone: null,
    tipo: 'responsavel',
    recebeNotificacoes: true,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServico() {
  const pacientesRepositorio = new RepositorioPacientesMemoria();
  const usuariosRepositorio = new RepositorioUsuariosMemoria();
  const pacientesResponsaveisRepositorio =
    new RepositorioPacientesResponsaveisMemoria();

  usuariosRepositorio.usuarios.push(
    criarUsuario(),
    criarUsuario({
      id: 'admin-1',
      nome: 'Admin',
      email: 'admin@example.com',
      tipo: 'administrador',
      recebeNotificacoes: false
    })
  );

  const servico = new PacientesServico(
    pacientesRepositorio as unknown as Repository<Paciente>,
    usuariosRepositorio as unknown as Repository<Usuario>,
    pacientesResponsaveisRepositorio as unknown as Repository<PacienteResponsavel>
  );

  return {
    pacientesRepositorio,
    pacientesResponsaveisRepositorio,
    servico,
    usuariosRepositorio
  };
}

describe('PacientesServico', () => {
  it('deve criar paciente sem usuario proprio', async () => {
    const { servico } = criarServico();

    const paciente = await servico.criar({
      nome: ' Joao Paciente ',
      dataNascimento: '1950-01-01',
      observacoes: ' Usa lembrete sonoro. '
    });

    expect(paciente).toMatchObject({
      usuarioId: null,
      nome: 'Joao Paciente',
      dataNascimento: '1950-01-01',
      observacoes: 'Usa lembrete sonoro.',
      ativo: true
    });
  });

  it('deve aceitar data de nascimento em formato brasileiro', async () => {
    const { servico } = criarServico();

    const paciente = await servico.criar({
      nome: 'Joao Paciente',
      dataNascimento: '01/01/1950'
    });

    expect(paciente.dataNascimento).toBe('1950-01-01');
  });

  it('deve criar paciente usando dados do proprio responsavel logado', async () => {
    const { pacientesResponsaveisRepositorio, servico } = criarServico();

    const paciente = await servico.criar(
      {
        souEuMesmo: true,
        dataNascimento: '1990-05-20'
      },
      { id: 'responsavel-1', tipo: 'responsavel' }
    );

    expect(paciente).toMatchObject({
      usuarioId: 'responsavel-1',
      nome: 'Maria Responsavel',
      dataNascimento: '1990-05-20'
    });
    expect(pacientesResponsaveisRepositorio.vinculos[0]).toMatchObject({
      pacienteId: paciente.id,
      responsavelId: 'responsavel-1'
    });
  });

  it('deve usar data de nascimento do responsavel quando souEuMesmo nao informar data', async () => {
    const { servico } = criarServico();

    const paciente = await servico.criar(
      { souEuMesmo: true },
      { id: 'responsavel-1', tipo: 'responsavel' }
    );

    expect(paciente).toMatchObject({
      usuarioId: 'responsavel-1',
      nome: 'Maria Responsavel',
      dataNascimento: '1990-05-20'
    });
  });

  it('deve vincular automaticamente paciente criado por responsavel logado', async () => {
    const { pacientesResponsaveisRepositorio, servico } = criarServico();

    const paciente = await servico.criar(
      {
        nome: 'Filho Paciente',
        dataNascimento: '2018-03-10'
      },
      { id: 'responsavel-1', tipo: 'responsavel' }
    );

    expect(pacientesResponsaveisRepositorio.vinculos).toHaveLength(1);
    expect(pacientesResponsaveisRepositorio.vinculos[0]).toMatchObject({
      pacienteId: paciente.id,
      responsavelId: 'responsavel-1',
      recebeNotificacoes: true,
      ativo: true
    });
  });

  it('deve listar apenas pacientes vinculados ao responsavel', async () => {
    const { servico } = criarServico();
    const pacienteVinculado = await servico.criar({ nome: 'Filho Paciente' });
    await servico.criar({ nome: 'Paciente de Outro Responsavel' });
    await servico.vincularResponsavel(pacienteVinculado.id, {
      responsavelId: 'responsavel-1'
    });

    const pacientes = await servico.listarMeus({
      id: 'responsavel-1',
      tipo: 'responsavel'
    });

    expect(pacientes).toHaveLength(1);
    expect(pacientes[0]?.id).toBe(pacienteVinculado.id);
  });

  it('deve bloquear responsavel sem vinculo ao buscar paciente', async () => {
    const { servico } = criarServico();
    const paciente = await servico.criar({ nome: 'Paciente Sem Vinculo' });

    await expect(
      servico.buscarPorId(paciente.id, {
        id: 'responsavel-1',
        tipo: 'responsavel'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 403,
      message: 'Usuario sem permissao para acessar este paciente'
    });
  });

  it('deve rejeitar usuarioId manual no cadastro de paciente', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        usuarioId: 'responsavel-1',
        nome: 'Paciente Invalido'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message:
        'Campo usuarioId nao deve ser enviado. Use souEuMesmo para cadastrar o responsavel logado como paciente.'
    });
  });

  it('deve permitir que um responsavel esteja vinculado a mais de um paciente', async () => {
    const { servico } = criarServico();

    const primeiroPaciente = await servico.criar(
      {
        souEuMesmo: true
      },
      { id: 'responsavel-1', tipo: 'responsavel' }
    );

    const segundoPaciente = await servico.criar(
      {
        nome: 'Joao Filho',
        dataNascimento: '10/03/2024'
      },
      { id: 'responsavel-1', tipo: 'responsavel' }
    );

    const pacientes = await servico.listarMeus({
      id: 'responsavel-1',
      tipo: 'responsavel'
    });

    expect(pacientes.map((paciente) => paciente.id).sort()).toEqual(
      [primeiroPaciente.id, segundoPaciente.id].sort()
    );
  });

  it('deve vincular responsavel ao paciente', async () => {
    const { servico } = criarServico();
    const paciente = await servico.criar({
      nome: 'Joao Paciente'
    });

    const vinculo = await servico.vincularResponsavel(paciente.id, {
      responsavelId: 'responsavel-1',
      parentesco: ' Filha ',
      recebeNotificacoes: true
    });

    expect(vinculo).toMatchObject({
      pacienteId: paciente.id,
      responsavelId: 'responsavel-1',
      parentesco: 'Filha',
      recebeNotificacoes: true,
      ativo: true
    });
  });

  it('deve reativar vinculo existente com responsavel', async () => {
    const { servico } = criarServico();
    const paciente = await servico.criar({
      nome: 'Joao Paciente'
    });
    await servico.vincularResponsavel(paciente.id, {
      responsavelId: 'responsavel-1',
      parentesco: 'Filha'
    });
    await servico.removerResponsavel(paciente.id, 'responsavel-1');

    const vinculo = await servico.vincularResponsavel(paciente.id, {
      responsavelId: 'responsavel-1',
      parentesco: 'Neta',
      recebeNotificacoes: false
    });

    expect(vinculo).toMatchObject({
      parentesco: 'Neta',
      recebeNotificacoes: false,
      ativo: true
    });
  });

  it('deve rejeitar vinculo com usuario que nao seja responsavel', async () => {
    const { servico } = criarServico();
    const paciente = await servico.criar({
      nome: 'Joao Paciente'
    });

    await expect(
      servico.vincularResponsavel(paciente.id, {
        responsavelId: 'admin-1'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 404,
      message: 'Usuario responsavel nao encontrado'
    });
  });

  it('deve listar apenas responsaveis ativos do paciente', async () => {
    const { servico } = criarServico();
    const paciente = await servico.criar({
      nome: 'Joao Paciente'
    });
    await servico.vincularResponsavel(paciente.id, {
      responsavelId: 'responsavel-1'
    });

    const responsaveis = await servico.listarResponsaveis(paciente.id);

    expect(responsaveis).toHaveLength(1);
    expect(responsaveis[0]?.responsavelId).toBe('responsavel-1');
  });
});
