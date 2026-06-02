import { TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoverUnicidadeUsuarioPaciente1830000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const resultadoRestricoes = await queryRunner.query(
      `
        SELECT con.conname AS constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'pacientes'
          AND nsp.nspname = current_schema()
          AND con.contype = 'u'
          AND (
            SELECT array_agg(att.attname::text ORDER BY att.attnum)
            FROM unnest(con.conkey) AS cols(attnum)
            JOIN pg_attribute att
              ON att.attrelid = con.conrelid
             AND att.attnum = cols.attnum
        ) = ARRAY['usuario_id']
      `
    );
    const restricoes = Array.isArray(resultadoRestricoes)
      ? resultadoRestricoes as Array<{ constraint_name: string }>
      : resultadoRestricoes.rows as Array<{ constraint_name: string }>;

    for (const restricao of restricoes) {
      await queryRunner.query(
        `ALTER TABLE "pacientes" DROP CONSTRAINT "${restricao.constraint_name}"`
      );
    }

    const tabela = await queryRunner.getTable('pacientes');
    const indiceUnico = tabela?.indices.find(
      (indice) =>
        indice.isUnique &&
        indice.columnNames.length === 1 &&
        indice.columnNames[0] === 'usuario_id'
    );

    if (indiceUnico) {
      await queryRunner.dropIndex('pacientes', indiceUnico);
    }

    await queryRunner.createIndex(
      'pacientes',
      new TableIndex({
        name: 'idx_pacientes_usuario_id',
        columnNames: ['usuario_id']
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tabela = await queryRunner.getTable('pacientes');
    const indiceUsuarioId = tabela?.indices.find(
      (indice) => indice.name === 'idx_pacientes_usuario_id'
    );

    if (indiceUsuarioId) {
      await queryRunner.dropIndex('pacientes', indiceUsuarioId);
    }

    await queryRunner.createIndex(
      'pacientes',
      new TableIndex({
        name: 'idx_pacientes_usuario_id_unico',
        columnNames: ['usuario_id'],
        isUnique: true
      })
    );
  }
}
