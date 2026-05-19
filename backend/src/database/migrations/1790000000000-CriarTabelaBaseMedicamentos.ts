import { Table, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelaBaseMedicamentos1790000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'base_medicamentos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'nome_produto',
            type: 'varchar',
            length: '180',
            isNullable: false
          },
          {
            name: 'categoria_produto',
            type: 'varchar',
            length: '180',
            isNullable: true
          },
          {
            name: 'principio_ativo',
            type: 'varchar',
            length: '240',
            isNullable: true
          },
          {
            name: 'concentracao',
            type: 'varchar',
            length: '80',
            isNullable: true
          },
          {
            name: 'destinacao',
            type: 'varchar',
            length: '120',
            isNullable: true
          },
          {
            name: 'forma_fisica',
            type: 'varchar',
            length: '180',
            isNullable: true
          },
          {
            name: 'restricao_prescricao',
            type: 'varchar',
            length: '180',
            isNullable: true
          },
          {
            name: 'restrito_hospitalar',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'restricao_uso',
            type: 'varchar',
            length: '180',
            isNullable: true
          },
          {
            name: 'fonte',
            type: 'varchar',
            length: '80',
            default: "'TA_RESTRICAO_MEDICAMENTO'",
            isNullable: false
          },
          {
            name: 'criado_em',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'atualizado_em',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          }
        ]
      })
    );

    await queryRunner.createIndices('base_medicamentos', [
      new TableIndex({
        name: 'idx_base_medicamentos_nome_produto',
        columnNames: ['nome_produto']
      }),
      new TableIndex({
        name: 'idx_base_medicamentos_principio_ativo',
        columnNames: ['principio_ativo']
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('base_medicamentos');
  }
}
