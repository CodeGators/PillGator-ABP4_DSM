import path from 'node:path';

import { AppDataSource } from '../config/data-source.js';
import { BaseMedicamento } from '../entidades/BaseMedicamento.js';
import { BaseMedicamentosServico } from '../modulos/baseMedicamentos/baseMedicamentosServico.js';

async function importarBaseMedicamentos(): Promise<void> {
  const caminhoArquivo =
    process.argv[2] ??
    path.resolve(process.cwd(), 'dados/TA_RESTRICAO_MEDICAMENTO.csv');

  await AppDataSource.initialize();

  const servico = new BaseMedicamentosServico(
    AppDataSource.getRepository(BaseMedicamento)
  );
  const resultado = await servico.importarCsv(caminhoArquivo);

  console.log(
    `Base de medicamentos importada: ${resultado.totalImportado}/${resultado.totalLido}`
  );
}

importarBaseMedicamentos()
  .catch((erro: unknown) => {
    console.error('Falha ao importar base de medicamentos', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
