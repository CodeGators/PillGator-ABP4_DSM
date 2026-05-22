import { TableColumn, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AtualizarMedicamentosPaciente1800000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('medicamentos', [
      new TableColumn({
        name: 'paciente_id',
        type: 'uuid',
        isNullable: true
      }),
      new TableColumn({
        name: 'base_medicamento_id',
        type: 'uuid',
        isNullable: true
      }),
      new TableColumn({
        name: 'quantidade_administrada',
        type: 'varchar',
        length: '80',
        isNullable: true
      }),
      new TableColumn({
        name: 'unidade_administracao',
        type: 'varchar',
        length: '40',
        isNullable: true
      })
    ]);

    await queryRunner.createForeignKeys('medicamentos', [
      new TableForeignKey({
        columnNames: ['paciente_id'],
        referencedTableName: 'pacientes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      }),
      new TableForeignKey({
        columnNames: ['base_medicamento_id'],
        referencedTableName: 'base_medicamentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    ]);

    await queryRunner.createIndices('medicamentos', [
      new TableIndex({
        name: 'idx_medicamentos_paciente_id',
        columnNames: ['paciente_id']
      }),
      new TableIndex({
        name: 'idx_medicamentos_base_medicamento_id',
        columnNames: ['base_medicamento_id']
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'medicamentos',
      'idx_medicamentos_base_medicamento_id'
    );
    await queryRunner.dropIndex('medicamentos', 'idx_medicamentos_paciente_id');

    const tabela = await queryRunner.getTable('medicamentos');
    const chaves = tabela?.foreignKeys.filter((chave) =>
      ['paciente_id', 'base_medicamento_id'].some((coluna) =>
        chave.columnNames.includes(coluna)
      )
    ) ?? [];

    for (const chave of chaves) {
      await queryRunner.dropForeignKey('medicamentos', chave);
    }

    await queryRunner.dropColumns('medicamentos', [
      'unidade_administracao',
      'quantidade_administrada',
      'base_medicamento_id',
      'paciente_id'
    ]);
  }
}
