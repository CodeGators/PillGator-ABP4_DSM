import { Table, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelaComandosDispositivos1820000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'comandos_dispositivos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'dispositivo_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'compartimento_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '40',
            isNullable: false
          },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            isNullable: false
          },
          {
            name: 'enviado_em',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'confirmado_em',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'expira_em',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'dados',
            type: 'jsonb',
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

    await queryRunner.createForeignKeys('comandos_dispositivos', [
      new TableForeignKey({
        columnNames: ['dispositivo_id'],
        referencedTableName: 'dispositivos',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      }),
      new TableForeignKey({
        columnNames: ['compartimento_id'],
        referencedTableName: 'compartimentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    ]);

    await queryRunner.createIndices('comandos_dispositivos', [
      new TableIndex({
        name: 'idx_comandos_dispositivos_dispositivo_status',
        columnNames: ['dispositivo_id', 'status']
      }),
      new TableIndex({
        name: 'idx_comandos_dispositivos_compartimento_id',
        columnNames: ['compartimento_id']
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('comandos_dispositivos');
  }
}
