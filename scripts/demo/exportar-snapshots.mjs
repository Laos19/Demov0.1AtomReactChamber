#!/usr/bin/env node
/**
 * Exporta instantáneas del dashboard y del aula demo desde la API real para el modo
 * demostración del frontend (GitHub Pages sin servidor).
 * Uso: API_URL=http://localhost:8080 node scripts/demo/exportar-snapshots.mjs
 */
import { writeFileSync } from 'node:fs';

const base = process.env.API_URL ?? 'http://localhost:8080';
const post = (r, b, t) => fetch(base + r, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(b) }).then((x) => x.json());
const get = (r, t) => fetch(base + r, { headers: { Authorization: `Bearer ${t}` } }).then((x) => x.json());

const { token } = await post('/api/auth/login', { email: 'docente@demo.arc.pe', password: 'quimica2026' });
const dash = await get('/api/dashboard', token);
const { aulas } = await get('/api/aulas', token);
const aula = await get(`/api/aulas/${aulas.find((a) => a.codigo === 'QUIM3A').id}`, token);
writeFileSync('frontend/src/data/dashboard-demo.json', JSON.stringify(dash) + '\n');
writeFileSync('frontend/src/data/aula-demo.json', JSON.stringify(aula) + '\n');
console.log('✔ frontend/src/data/dashboard-demo.json y aula-demo.json');
