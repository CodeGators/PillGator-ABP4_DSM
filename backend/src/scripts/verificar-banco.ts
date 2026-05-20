import { AppDataSource } from '../config/data-source.js';

const tabelasEsperadas = [
  'medicamentos',
  'base_medicamentos',
  'agendamentos_medicamentos',
  'eventos_medicamentos',
  'usuarios',
  'pacientes',
  'pacientes_responsaveis',
  'tokens_push',
  'dispositivos',
  'compartimentos',
  'comandos_dispositivos',
  'notificacoes'
];

async function verificarBanco(): Promise<void> {
  await AppDataSource.initialize();

  const tabelasEncontradas = await AppDataSource.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
      ORDER BY table_name
    `,
    [tabelasEsperadas]
  );

  const nomesEncontrados = new Set(
    tabelasEncontradas.map((linha: { table_name: string }) => linha.table_name)
  );
  const tabelasAusentes = tabelasEsperadas.filter(
    (tabela) => !nomesEncontrados.has(tabela)
  );

  if (tabelasAusentes.length > 0) {
    throw new Error(
      `Tabelas ausentes: ${tabelasAusentes.join(', ')}. Rode npm run migration:run.`
    );
  }

  console.log(`Banco validado com sucesso: ${tabelasEsperadas.join(', ')}`);
}

verificarBanco()
  .catch((erro: unknown) => {
    console.error('Falha ao validar banco', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
