import { TableColumn, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarDadosCadastroUsuarios1780000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('usuarios', [
      new TableColumn({
        name: 'cpf',
        type: 'varchar',
        length: '11',
        isNullable: true
      }),
      new TableColumn({
        name: 'data_nascimento',
        type: 'date',
        isNullable: true
      }),
      new TableColumn({
        name: 'endereco_rua',
        type: 'varchar',
        length: '160',
        isNullable: true
      }),
      new TableColumn({
        name: 'endereco_estado',
        type: 'varchar',
        length: '2',
        isNullable: true
      }),
      new TableColumn({
        name: 'endereco_cidade',
        type: 'varchar',
        length: '120',
        isNullable: true
      }),
      new TableColumn({
        name: 'endereco_cep',
        type: 'varchar',
        length: '8',
        isNullable: true
      }),
      new TableColumn({
        name: 'endereco_complemento',
        type: 'varchar',
        length: '120',
        isNullable: true
      })
    ]);

    await queryRunner.createIndex(
      'usuarios',
      new TableIndex({
        name: 'idx_usuarios_cpf_unico',
        columnNames: ['cpf'],
        isUnique: true
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('usuarios', 'idx_usuarios_cpf_unico');
    await queryRunner.dropColumns('usuarios', [
      'endereco_complemento',
      'endereco_cep',
      'endereco_cidade',
      'endereco_estado',
      'endereco_rua',
      'data_nascimento',
      'cpf'
    ]);
  }
}
