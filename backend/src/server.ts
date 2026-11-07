import { buildApp } from './app.js';
import { loadConfig } from './config.js';

/**
 * Punto de entrada: valida configuración, construye la app y escucha en PORT.
 * Apagado ordenado ante SIGTERM (Render lo envía al redeployar).
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);
  const cerrar = async (senal: string) => {
    app.log.info({ senal }, 'apagando');
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void cerrar('SIGTERM'));
  process.on('SIGINT', () => void cerrar('SIGINT'));
  await app.listen({ port: config.PORT, host: config.HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
