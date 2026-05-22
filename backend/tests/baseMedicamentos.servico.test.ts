import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { Repository } from 'typeorm';

import { BaseMedicamento } from '../src/entidades/BaseMedicamento.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { BaseMedicamentosServico } from '../src/modulos/baseMedicamentos/baseMedicamentosServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioBaseMedicamentosMemoria {
  public medicamentos: BaseMedicamento[] = [];
  public fontesRemovidas: string[] = [];

  public create(dados: Partial<BaseMedicamento>): BaseMedicamento {
    return Object.assign(new BaseMedicamento(), {
      id: `base-${this.medicamentos.length + 1}`,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(
    medicamentos: BaseMedicamento[]
  ): Promise<BaseMedicamento[]> {
    this.medicamentos.push(...medicamentos);

    return medicamentos;
  }

  public async delete(filtro: { fonte: string }): Promise<void> {
    this.fontesRemovidas.push(filtro.fonte);
    this.medicamentos = this.medicamentos.filter(
      (medicamento) => medicamento.fonte !== filtro.fonte
    );
  }

  public async find(): Promise<BaseMedicamento[]> {
    return this.medicamentos;
  }

  public async findOne(opcoes: {
    where: Partial<BaseMedicamento>;
  }): Promise<BaseMedicamento | null> {
    return (
      this.medicamentos.find((medicamento) => {
        return medicamento.id === opcoes.where.id;
      }) ?? null
    );
  }
}

function criarServico() {
  const repositorio = new RepositorioBaseMedicamentosMemoria();
  const servico = new BaseMedicamentosServico(
    repositorio as unknown as Repository<BaseMedicamento>
  );

  return { repositorio, servico };
}

describe('BaseMedicamentosServico', () => {
  it('deve converter linhas do CSV para medicamentos da base', () => {
    const { servico } = criarServico();

    const medicamentos = servico.converterCsv(
      [
        'NO_PRODUTO;DS_CATEGORIA_PRODUTO;NO_PRINICIPIO_ATIVO;DS_CONCENTRACAO;DS_DESTINACAO;DS_FORMA_FISICA;DS_RESTRICAO_PRESCRICAO;ST_RESTRITO_HOSPITAL;DS_RESTRICAO_USO',
        'AAS;ANALGESICOS;ACIDO ACETILSALICILICO;100,000;;COMPRIMIDO;;Não;Adulto',
        'ABELCET;ANTI-FUNGICOS;ANFOTERICINA B;5,00;;SUSPENSAO INJETAVEL;;Sim;Adulto'
      ].join('\n')
    );

    expect(medicamentos).toHaveLength(2);
    expect(medicamentos[0]).toMatchObject({
      nomeProduto: 'AAS',
      categoriaProduto: 'ANALGESICOS',
      principioAtivo: 'ACIDO ACETILSALICILICO',
      concentracao: '100,000',
      restritoHospitalar: false,
      restricaoUso: 'Adulto'
    });
    expect(medicamentos[1]?.restritoHospitalar).toBe(true);
  });

  it('deve importar CSV removendo dados antigos da mesma fonte', async () => {
    const { repositorio, servico } = criarServico();
    const pasta = await mkdtemp(path.join(tmpdir(), 'pillgator-base-'));
    const arquivo = path.join(pasta, 'base.csv');
    await writeFile(
      arquivo,
      [
        'NO_PRODUTO;DS_CATEGORIA_PRODUTO;NO_PRINICIPIO_ATIVO;DS_CONCENTRACAO;DS_DESTINACAO;DS_FORMA_FISICA;DS_RESTRICAO_PRESCRICAO;ST_RESTRITO_HOSPITAL;DS_RESTRICAO_USO',
        'AAS;ANALGESICOS;ACIDO ACETILSALICILICO;100,000;;COMPRIMIDO;;Não;Adulto'
      ].join('\n'),
      'utf8'
    );

    const resultado = await servico.importarCsv(arquivo);

    expect(resultado).toEqual({ totalLido: 1, totalImportado: 1 });
    expect(repositorio.fontesRemovidas).toEqual(['TA_RESTRICAO_MEDICAMENTO']);
    expect(repositorio.medicamentos[0]).toMatchObject({
      nomeProduto: 'AAS',
      fonte: 'TA_RESTRICAO_MEDICAMENTO'
    });
  });

  it('deve buscar medicamento da base por id', async () => {
    const { repositorio, servico } = criarServico();
    repositorio.medicamentos.push(
      Object.assign(new BaseMedicamento(), {
        id: 'base-1',
        nomeProduto: 'AAS'
      })
    );

    const medicamento = await servico.buscarPorId('base-1');

    expect(medicamento.nomeProduto).toBe('AAS');
  });

  it('deve rejeitar id inexistente', async () => {
    const { servico } = criarServico();

    await expect(servico.buscarPorId('inexistente')).rejects.toMatchObject<
      Partial<ErroHttp>
    >({
      statusCode: 404,
      message: 'Medicamento da base nao encontrado'
    });
  });
});
