import { readFile } from 'node:fs/promises';

import { ILike, type FindOptionsWhere, type Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { BaseMedicamento } from '../../entidades/BaseMedicamento.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  BaseMedicamentoCsv,
  BaseMedicamentosServicoContrato,
  ListarBaseMedicamentosFiltros,
  ResultadoImportacaoBaseMedicamentos
} from './baseMedicamentosTipos.js';

const fontePadrao = 'TA_RESTRICAO_MEDICAMENTO';
const tamanhoLoteImportacao = 500;

export class BaseMedicamentosServico
  implements BaseMedicamentosServicoContrato
{
  constructor(
    private readonly repositorio: Repository<BaseMedicamento>
  ) {}

  public async listar(
    filtros: ListarBaseMedicamentosFiltros = {}
  ): Promise<BaseMedicamento[]> {
    const busca = filtros.busca?.trim();

    if (!busca) {
      return this.repositorio.find({
        order: { nomeProduto: 'ASC' },
        take: 50
      });
    }

    const termo = `%${busca}%`;
    const where: FindOptionsWhere<BaseMedicamento>[] = [
      { nomeProduto: ILike(termo) },
      { principioAtivo: ILike(termo) },
      { categoriaProduto: ILike(termo) },
      { formaFisica: ILike(termo) }
    ];

    return this.repositorio.find({
      where,
      order: { nomeProduto: 'ASC' },
      take: 50
    });
  }

  public async buscarPorId(id: string): Promise<BaseMedicamento> {
    const medicamento = await this.repositorio.findOne({
      where: { id }
    });

    if (!medicamento) {
      throw new ErroHttp(404, 'Medicamento da base nao encontrado');
    }

    return medicamento;
  }

  public async importarCsv(
    caminhoArquivo: string
  ): Promise<ResultadoImportacaoBaseMedicamentos> {
    const conteudo = await readFile(caminhoArquivo, 'utf8');
    const medicamentos = this.converterCsv(conteudo);

    await this.repositorio.delete({ fonte: fontePadrao });
    await this.salvarEmLotes(medicamentos);

    return {
      totalLido: medicamentos.length,
      totalImportado: medicamentos.length
    };
  }

  public converterCsv(conteudo: string): BaseMedicamentoCsv[] {
    const linhas = conteudo
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter(Boolean);
    const [, ...dados] = linhas;

    return dados
      .map((linha) => this.converterLinhaCsv(linha))
      .filter(
        (medicamento): medicamento is BaseMedicamentoCsv =>
          medicamento !== null
      );
  }

  private converterLinhaCsv(linha: string): BaseMedicamentoCsv | null {
    const colunas = linha.split(';');
    const nomeProduto = this.normalizarTexto(colunas[0]);

    if (!nomeProduto) {
      return null;
    }

    return {
      nomeProduto,
      categoriaProduto: this.normalizarTexto(colunas[1]),
      principioAtivo: this.normalizarTexto(colunas[2]),
      concentracao: this.normalizarTexto(colunas[3]),
      destinacao: this.normalizarTexto(colunas[4]),
      formaFisica: this.normalizarTexto(colunas[5]),
      restricaoPrescricao: this.normalizarTexto(colunas[6]),
      restritoHospitalar: this.normalizarBooleanoSimNao(colunas[7]),
      restricaoUso: this.normalizarTexto(colunas[8]),
      fonte: fontePadrao
    };
  }

  private normalizarTexto(valor: string | undefined): string | null {
    const texto = valor?.trim();

    return texto || null;
  }

  private normalizarBooleanoSimNao(valor: string | undefined): boolean {
    return valor?.trim().toLowerCase() === 'sim';
  }

  private async salvarEmLotes(
    medicamentos: BaseMedicamentoCsv[]
  ): Promise<void> {
    for (let indice = 0; indice < medicamentos.length; indice += tamanhoLoteImportacao) {
      const lote = medicamentos.slice(indice, indice + tamanhoLoteImportacao);
      const entidades = lote.map((medicamento) =>
        this.repositorio.create(medicamento)
      );

      await this.repositorio.save(entidades);
    }
  }
}

export function criarBaseMedicamentosServico(): BaseMedicamentosServico {
  return new BaseMedicamentosServico(
    AppDataSource.getRepository(BaseMedicamento)
  );
}
