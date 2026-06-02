import { Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarFotoPacienteERecuperacaoSenha1840000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tabelaPacientes = await queryRunner.getTable('pacientes');

    if (!tabelaPacientes?.findColumnByName('foto_url')) {
      await queryRunner.addColumn(
        'pacientes',
        new TableColumn({
          name: 'foto_url',
          type: 'text',
          isNullable: true
        })
      );
    }

    await queryRunner.createTable(
      new Table({
        name: 'recuperacoes_senha',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'usuario_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '64',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'expira_em',
            type: 'timestamp with time zone',
            isNullable: false
          },
          {
            name: 'usado_em',
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
      'recuperacoes_senha',
      new TableForeignKey({
        columnNames: ['usuario_id'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createIndices('recuperacoes_senha', [
      new TableIndex({
        name: 'idx_recuperacoes_senha_usuario_id',
        columnNames: ['usuario_id']
      }),
      new TableIndex({
        name: 'idx_recuperacoes_senha_expira_em',
        columnNames: ['expira_em']
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('recuperacoes_senha');

    const tabelaPacientes = await queryRunner.getTable('pacientes');

    if (tabelaPacientes?.findColumnByName('foto_url')) {
      await queryRunner.dropColumn('pacientes', 'foto_url');
    }
  }
}
