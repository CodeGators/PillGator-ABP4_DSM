import app from './app.js';
import { AppDataSource } from './config/data-source.js';
import { env } from './config/env.js';
import { iniciarMqtt } from './modulos/mqtt/mqttCliente.js';

async function iniciarServidor(): Promise<void> {
  await AppDataSource.initialize();
  iniciarMqtt();

  app.listen(env.porta, () => {
    console.log(`Server running on port ${env.porta}`);
  });
}

iniciarServidor().catch((erro: unknown) => {
  console.error('Erro ao iniciar servidor', erro);
  process.exit(1);
});

