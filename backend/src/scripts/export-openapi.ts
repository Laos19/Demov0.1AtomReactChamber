/**
 * Exporta la especificación OpenAPI a docs/api/openapi.json sin abrir puerto.
 * Uso: DATABASE_URL=... npm run openapi -w backend
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildApp } from '../app.js';
import { loadConfig } from '../config.js';

const config = loadConfig({
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://localhost/arc',
  JWT_SECRET: process.env.JWT_SECRET ?? 'x'.repeat(32),
  NODE_ENV: 'test',
});
const app = await buildApp(config);
await app.ready();
mkdirSync('../docs/api', { recursive: true });
writeFileSync('../docs/api/openapi.json', JSON.stringify(app.swagger(), null, 2));
console.log('✔ docs/api/openapi.json');
await app.close();
