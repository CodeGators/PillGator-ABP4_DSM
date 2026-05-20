import type { Repository } from 'typeorm';

import { BaseMedicamento } from '../src/entidades/BaseMedicamento.js';
import { Medicamento } from '../src/entidades/Medicamento.js';
import { Paciente } from '../src/entidades/Paciente.js';
import { PacienteResponsavel } from '../src/entidades/PacienteResponsavel.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { MedicamentosServico } from '../src/modulos/medicamentos/medicamentosServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');
const contextoResponsavel = {
  id: 'responsavel-1',
  tipo: 'responsavel' as const
};

class RepositorioMedicamentosMemoria {
  public medicamentos: Medicamento[] = [];

  public create(dados: Partial<Medicamento>): Medicamento {
    return Object.assign(new Medicamento(), {
      id: `medicamento-${this.medicamentos.length + 1}`,
      pacienteId: null,
      baseMedicamentoId: null,
      observacoes: null,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(medicamento: Medicamento): Promise<Medicamento> {
    const indice = this.medicamentos.findIndex(
      (item) => item.id === medicamento.id
    );

    if (indice >= 0) {
      this.medicamentos[indice] = medicamento;
    } else {
      this.medicamentos.push(medicamento);
    }

    return medicamento;
  }

  public async find(opcoes: {
    where:
      | { ativo?: boolean; pacienteId?: string }
      | Array<{ ativo?: boolean; pacienteId?: string }>;
  }): Promise<Medicamento[]> {
    const filtros = Array.isArray(opcoes.where) ? opcoes.where : [opcoes.where];

    return this.medicamentos
      .filter((medicamento) =>
        filtros.some(
          (filtro) =>
            (filtro.ativo === undefined || medicamento.ativo === filtro.ativo) &&
            (filtro.pacienteId === undefined ||
              medicamento.pacienteId === filtro.pacienteId)
        )
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  public async findOne(opcoes: {
    where: { id: string; ativo: boolean };
  }): Promise<Medicamento | null> {
    return (
      this.medicamentos.find(
        (medicamento) =>
          medicamento.id === opcoes.where.id &&
          medicamento.ativo === opcoes.where.ativo
      ) ?? null
    );
  }
}

class RepositorioPacientesMemoria {
  public pacientes: Paciente[] = [
    Object.assign(new Paciente(), {
      id: 'paciente-1',
      nome: 'Maria Paciente',
      ativo: true
    }),
    Object.assign(new Paciente(), {
      id: 'paciente-2',
      nome: 'Joao Paciente',
      ativo: true
    })
  ];

  public async findOne(opcoes: {
    where: { id: string; ativo: boolean };
  }): Promise<Paciente | null> {
    return (
      this.pacientes.find(
        (paciente) =>
          paciente.id === opcoes.where.id && paciente.ativo === opcoes.where.ativo
      ) ?? null
    );
  }
}

class RepositorioPacientesResponsaveisMemoria {
  public vinculos: PacienteResponsavel[] = [
    Object.assign(new PacienteResponsavel(), {
      pacienteId: 'paciente-1',
      responsavelId: 'responsavel-1',
      ativo: true
    })
  ];

  public async find(opcoes: {
    where: { responsavelId: string; ativo: boolean };
  }): Promise<PacienteResponsavel[]> {
    return this.vinculos.filter(
      (vinculo) =>
        vinculo.responsavelId === opcoes.where.responsavelId &&
        vinculo.ativo === opcoes.where.ativo
    );
  }

  public async findOne(opcoes: {
    where: { pacienteId: string; responsavelId: string; ativo: boolean };
  }): Promise<PacienteResponsavel | null> {
    return (
      this.vinculos.find(
        (vinculo) =>
          vinculo.pacienteId === opcoes.where.pacienteId &&
          vinculo.responsavelId === opcoes.where.responsavelId &&
          vinculo.ativo === opcoes.where.ativo
      ) ?? null
    );
  }
}

class RepositorioBaseMedicamentosMemoria {
  public medicamentos: BaseMedicamento[] = [
    Object.assign(new BaseMedicamento(), {
      id: 'base-1',
      nomeProduto: 'Dipirona',
      concentracao: '500mg'
    })
  ];

  public async findOne(opcoes: {
    where: { id: string };
  }): Promise<BaseMedicamento | null> {
    return (
      this.medicamentos.find(
        (medicamento) => medicamento.id === opcoes.where.id
      ) ?? null
    );
  }
}

function criarServico() {
  const medicamentosRepositorio = new RepositorioMedicamentosMemoria();
  const pacientesRepositorio = new RepositorioPacientesMemoria();
  const pacientesResponsaveisRepositorio =
    new RepositorioPacientesResponsaveisMemoria();
  const baseMedicamentosRepositorio = new RepositorioBaseMedicamentosMemoria();
  const servico = new MedicamentosServico(
    medicamentosRepositorio as unknown as Repository<Medicamento>,
    pacientesRepositorio as unknown as Repository<Paciente>,
    pacientesResponsaveisRepositorio as unknown as Repository<PacienteResponsavel>,
    baseMedicamentosRepositorio as unknown as Repository<BaseMedicamento>
  );

  return {
    baseMedicamentosRepositorio,
    medicamentosRepositorio,
    pacientesRepositorio,
    pacientesResponsaveisRepositorio,
    servico
  };
}

describe('MedicamentosServico', () => {
  it('deve criar medicamento do paciente com dados normalizados', async () => {
    const { medicamentosRepositorio, servico } = criarServico();

    const medicamento = await servico.criar(
      {
        pacienteId: 'paciente-1',
        nome: ' Dipirona ',
        dosagem: ' 500mg ',
        quantidadeAdministrada: ' 1 ',
        unidadeAdministracao: ' comprimido ',
        observacoes: ' Tomar com agua '
      },
      contextoResponsavel
    );

    expect(medicamento).toMatchObject({
      pacienteId: 'paciente-1',
      nome: 'Dipirona',
      dosagem: '500mg',
      quantidadeAdministrada: '1',
      unidadeAdministracao: 'comprimido',
      observacoes: 'Tomar com agua',
      ativo: true
    });
    expect(medicamentosRepositorio.medicamentos).toHaveLength(1);
  });

  it('deve preencher nome e dosagem usando medicamento da base', async () => {
    const { servico } = criarServico();

    const medicamento = await servico.criar(
      {
        pacienteId: 'paciente-1',
        baseMedicamentoId: 'base-1',
        quantidadeAdministrada: '20',
        unidadeAdministracao: 'gotas'
      },
      contextoResponsavel
    );

    expect(medicamento).toMatchObject({
      baseMedicamentoId: 'base-1',
      nome: 'Dipirona',
      dosagem: '500mg',
      quantidadeAdministrada: '20',
      unidadeAdministracao: 'gotas'
    });
  });

  it('deve rejeitar criacao sem paciente', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        nome: 'Dipirona',
        dosagem: '500mg',
        quantidadeAdministrada: '1',
        unidadeAdministracao: 'comprimido'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Campo pacienteId e obrigatorio'
    });
  });

  it('deve impedir responsavel de criar medicamento para paciente nao vinculado', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar(
        {
          pacienteId: 'paciente-2',
          nome: 'Dipirona',
          dosagem: '500mg',
          quantidadeAdministrada: '1',
          unidadeAdministracao: 'comprimido'
        },
        contextoResponsavel
      )
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 403,
      message: 'Usuario sem permissao para acessar medicamentos deste paciente'
    });
  });

  it('deve listar apenas medicamentos de pacientes vinculados ao responsavel', async () => {
    const { medicamentosRepositorio, servico } = criarServico();
    await medicamentosRepositorio.save(
      medicamentosRepositorio.create({
        id: 'medicamento-1',
        pacienteId: 'paciente-1',
        nome: 'Dipirona',
        dosagem: '500mg'
      })
    );
    await medicamentosRepositorio.save(
      medicamentosRepositorio.create({
        id: 'medicamento-2',
        pacienteId: 'paciente-2',
        nome: 'Amoxicilina',
        dosagem: '250mg'
      })
    );

    const medicamentos = await servico.listar({}, contextoResponsavel);

    expect(medicamentos).toHaveLength(1);
    expect(medicamentos[0]?.id).toBe('medicamento-1');
  });

  it('deve atualizar medicamento existente', async () => {
    const { medicamentosRepositorio, servico } = criarServico();
    await medicamentosRepositorio.save(
      medicamentosRepositorio.create({
        id: 'medicamento-1',
        pacienteId: 'paciente-1',
        nome: 'Dipirona',
        dosagem: '500mg',
        quantidadeAdministrada: '1',
        unidadeAdministracao: 'comprimido'
      })
    );

    const atualizado = await servico.atualizar(
      'medicamento-1',
      {
        quantidadeAdministrada: '2',
        unidadeAdministracao: 'comprimidos',
        observacoes: ''
      },
      contextoResponsavel
    );

    expect(atualizado.quantidadeAdministrada).toBe('2');
    expect(atualizado.unidadeAdministracao).toBe('comprimidos');
    expect(atualizado.observacoes).toBeNull();
  });

  it('deve desativar medicamento ao remover', async () => {
    const { medicamentosRepositorio, servico } = criarServico();
    await medicamentosRepositorio.save(
      medicamentosRepositorio.create({
        id: 'medicamento-1',
        pacienteId: 'paciente-1',
        nome: 'Dipirona',
        dosagem: '500mg'
      })
    );

    await servico.remover('medicamento-1', contextoResponsavel);

    expect(medicamentosRepositorio.medicamentos[0]?.ativo).toBe(false);
  });
});
