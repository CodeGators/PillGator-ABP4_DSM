import { Table, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelaTokensPush1810000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tokens_push',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'responsavel_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'plataforma',
            type: 'varchar',
            length: '20',
            default: "'desconhecida'",
            isNullable: false
          },
          {
            name: 'dispositivo_nome',
            type: 'varchar',
            length: '120',
            isNullable: true
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
            isNullable: false
          },
          {
            name: 'ultimo_registro_em',
            type: 'timestamp with time zone',
            isNullable: true
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

    await queryRunner.createForeignKey(
      'tokens_push',
      new TableForeignKey({
        columnNames: ['responsavel_id'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createIndices('tokens_push', [
      new TableIndex({
        name: 'idx_tokens_push_responsavel_id',
        columnNames: ['responsavel_id']
      }),
      new TableIndex({
        name: 'idx_tokens_push_ativo',
        columnNames: ['ativo']
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tokens_push');
  }
}
