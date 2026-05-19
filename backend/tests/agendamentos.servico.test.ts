import type { Repository } from 'typeorm';

import { AgendamentoMedicamento } from '../src/entidades/AgendamentoMedicamento.js';
import { Medicamento } from '../src/entidades/Medicamento.js';
import { PacienteResponsavel } from '../src/entidades/PacienteResponsavel.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { AgendamentosServico } from '../src/modulos/agendamentos/agendamentosServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');
const contextoResponsavel = {
  id: 'responsavel-1',
  tipo: 'responsavel' as const
};

class RepositorioAgendamentosMemoria {
  public agendamentos: AgendamentoMedicamento[] = [];
  public medicamentos: Medicamento[] = [];

  public create(dados: Partial<AgendamentoMedicamento>): AgendamentoMedicamento {
    return Object.assign(new AgendamentoMedicamento(), {
      id: 'novo-agendamento',
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(
    agendamento: AgendamentoMedicamento
  ): Promise<AgendamentoMedicamento> {
    const indice = this.agendamentos.findIndex(
      (item) => item.id === agendamento.id
    );

    if (indice >= 0) {
      this.agendamentos[indice] = agendamento;
    } else {
      this.agendamentos.push(agendamento);
    }

    return agendamento;
  }

  public async find(opcoes: {
    where: Partial<AgendamentoMedicamento>;
  }): Promise<AgendamentoMedicamento[]> {
    return this.agendamentos
      .filter((agendamento) => {
        if (
          opcoes.where.ativo !== undefined &&
          agendamento.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        if (
          opcoes.where.medicamentoId !== undefined &&
          agendamento.medicamentoId !== opcoes.where.medicamentoId
        ) {
          return false;
        }

        return true;
      })
      .map((agendamento) => this.comMedicamento(agendamento));
  }

  public async findOne(opcoes: {
    where: { id: string; ativo: boolean };
  }): Promise<AgendamentoMedicamento | null> {
    const agendamento = (
      this.agendamentos.find(
        (agendamento) =>
          agendamento.id === opcoes.where.id &&
          agendamento.ativo === opcoes.where.ativo
      ) ?? null
    );

    return agendamento ? this.comMedicamento(agendamento) : null;
  }

  private comMedicamento(
    agendamento: AgendamentoMedicamento
  ): AgendamentoMedicamento {
    agendamento.medicamento =
      this.medicamentos.find(
        (medicamento) => medicamento.id === agendamento.medicamentoId
      ) ?? agendamento.medicamento;

    return agendamento;
  }
}

class RepositorioMedicamentosMemoria {
  public medicamentos: Medicamento[] = [];

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

function criarMedicamento(
  sobrescritas: Partial<Medicamento> = {}
): Medicamento {
  return Object.assign(new Medicamento(), {
    id: 'medicamento-1',
    pacienteId: 'paciente-1',
    nome: 'Losartana',
    dosagem: '50mg',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServico() {
  const agendamentosRepositorio = new RepositorioAgendamentosMemoria();
  const medicamentosRepositorio = new RepositorioMedicamentosMemoria();
  const pacientesResponsaveisRepositorio =
    new RepositorioPacientesResponsaveisMemoria();
  medicamentosRepositorio.medicamentos.push(criarMedicamento());
  agendamentosRepositorio.medicamentos = medicamentosRepositorio.medicamentos;

  const servico = new AgendamentosServico(
    agendamentosRepositorio as unknown as Repository<AgendamentoMedicamento>,
    medicamentosRepositorio as unknown as Repository<Medicamento>,
    pacientesResponsaveisRepositorio as unknown as Repository<PacienteResponsavel>
  );

  return {
    agendamentosRepositorio,
    medicamentosRepositorio,
    pacientesResponsaveisRepositorio,
    servico
  };
}

describe('AgendamentosServico', () => {
  it('deve criar agendamento por horarios fixos', async () => {
    const { servico } = criarServico();

    const agendamento = await servico.criar({
      medicamentoId: 'medicamento-1',
      tipo: 'horarios_fixos',
      diasSemana: [5, 1, 1, 3],
      horarios: ['20:00', '08:00', '08:00'],
      inicioEm: '2026-05-01',
      toleranciaMinutos: 45,
      cuidados: 'Nao tomar junto com leite'
    });

    expect(agendamento).toMatchObject({
      medicamentoId: 'medicamento-1',
      tipo: 'horarios_fixos',
      diasSemana: [1, 3, 5],
      horarios: ['08:00', '20:00'],
      intervaloHoras: null,
      horarioInicio: null,
      inicioEm: '2026-05-01',
      toleranciaMinutos: 45,
      cuidados: 'Nao tomar junto com leite',
      ativo: true
    });
  });

  it('deve criar agendamento de 8 em 8 horas', async () => {
    const { servico } = criarServico();

    const agendamento = await servico.criar({
      medicamentoId: 'medicamento-1',
      tipo: 'intervalo',
      diasSemana: [0, 1, 2, 3, 4, 5, 6],
      intervaloHoras: 8,
      horarioInicio: '06:00'
    });

    expect(agendamento).toMatchObject({
      tipo: 'intervalo',
      horarios: null,
      intervaloHoras: 8,
      horarioInicio: '06:00'
    });
  });

  it('deve rejeitar agendamento para medicamento inexistente ou inativo', async () => {
    const { medicamentosRepositorio, servico } = criarServico();
    medicamentosRepositorio.medicamentos[0]!.ativo = false;

    await expect(
      servico.criar({
        medicamentoId: 'medicamento-1',
        tipo: 'horarios_fixos',
        diasSemana: [1],
        horarios: ['08:00']
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 404,
      message: 'Medicamento nao encontrado para agendamento'
    });
  });

  it('deve impedir responsavel de agendar medicamento de paciente nao vinculado', async () => {
    const { medicamentosRepositorio, servico } = criarServico();
    medicamentosRepositorio.medicamentos[0]!.pacienteId = 'paciente-2';

    await expect(
      servico.criar(
        {
          medicamentoId: 'medicamento-1',
          tipo: 'horarios_fixos',
          diasSemana: [1],
          horarios: ['08:00']
        },
        contextoResponsavel
      )
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 403,
      message: 'Usuario sem permissao para acessar agendamentos deste paciente'
    });
  });

  it('deve rejeitar horario invalido', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        medicamentoId: 'medicamento-1',
        tipo: 'horarios_fixos',
        diasSemana: [1],
        horarios: ['25:00']
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Campo horarios deve estar no formato HH:mm'
    });
  });

  it('deve rejeitar dia da semana invalido', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        medicamentoId: 'medicamento-1',
        tipo: 'horarios_fixos',
        diasSemana: [7],
        horarios: ['08:00']
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Campo diasSemana deve estar entre 0 e 6'
    });
  });

  it('deve rejeitar periodo com fim anterior ao inicio', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        medicamentoId: 'medicamento-1',
        tipo: 'intervalo',
        diasSemana: [1],
        intervaloHoras: 8,
        horarioInicio: '06:00',
        inicioEm: '2026-05-10',
        fimEm: '2026-05-01'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Campo fimEm deve ser maior ou igual a inicioEm'
    });
  });

  it('deve atualizar agendamento existente', async () => {
    const { agendamentosRepositorio, servico } = criarServico();
    const agendamento = agendamentosRepositorio.create({
      id: 'agendamento-1',
      medicamentoId: 'medicamento-1',
      tipo: 'horarios_fixos',
      diasSemana: [1, 2, 3, 4, 5],
      horarios: ['08:00'],
      intervaloHoras: null,
      horarioInicio: null,
      inicioEm: null,
      fimEm: null,
      toleranciaMinutos: 30,
      cuidados: null
    });
    await agendamentosRepositorio.save(agendamento);

    const atualizado = await servico.atualizar('agendamento-1', {
      tipo: 'intervalo',
      intervaloHoras: 12,
      horarioInicio: '07:00',
      cuidados: ''
    });

    expect(atualizado).toMatchObject({
      tipo: 'intervalo',
      horarios: null,
      intervaloHoras: 12,
      horarioInicio: '07:00',
      cuidados: null
    });
  });

  it('deve listar proximas administracoes do dia', async () => {
    const { agendamentosRepositorio, servico } = criarServico();
    await agendamentosRepositorio.save(
      agendamentosRepositorio.create({
        id: 'agendamento-1',
        medicamentoId: 'medicamento-1',
        tipo: 'horarios_fixos',
        diasSemana: [5],
        horarios: ['08:00', '20:00'],
        intervaloHoras: null,
        horarioInicio: null,
        inicioEm: '2026-05-01',
        fimEm: null,
        toleranciaMinutos: 30,
        cuidados: 'Tomar com agua'
      })
    );

    const administracoes = await servico.listarProximasAdministracoes({
      pacienteId: 'paciente-1',
      data: '2026-05-01'
    });

    expect(administracoes).toEqual([
      {
        agendamentoId: 'agendamento-1',
        medicamentoId: 'medicamento-1',
        pacienteId: 'paciente-1',
        medicamentoNome: 'Losartana',
        horarioPrevisto: '2026-05-01T08:00:00',
        tipo: 'horarios_fixos',
        cuidados: 'Tomar com agua'
      },
      {
        agendamentoId: 'agendamento-1',
        medicamentoId: 'medicamento-1',
        pacienteId: 'paciente-1',
        medicamentoNome: 'Losartana',
        horarioPrevisto: '2026-05-01T20:00:00',
        tipo: 'horarios_fixos',
        cuidados: 'Tomar com agua'
      }
    ]);
  });

  it('deve desativar agendamento ao remover', async () => {
    const { agendamentosRepositorio, servico } = criarServico();
    await agendamentosRepositorio.save(
      agendamentosRepositorio.create({
        id: 'agendamento-1',
        medicamentoId: 'medicamento-1',
        tipo: 'horarios_fixos',
        diasSemana: [1],
        horarios: ['08:00'],
        intervaloHoras: null,
        horarioInicio: null,
        inicioEm: null,
        fimEm: null,
        toleranciaMinutos: 30,
        cuidados: null
      })
    );

    await servico.remover('agendamento-1');

    expect(agendamentosRepositorio.agendamentos[0]?.ativo).toBe(false);
  });
});
