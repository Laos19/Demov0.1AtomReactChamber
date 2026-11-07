# findings.md — Hallazgos

## Estado v0.1
- Un solo componente React (`frontend/src/AtomReactChamber.jsx`, 1541 líneas): motor físico, render canvas y UI mezclados.
- Catálogo químico hardcodeado: 13 especies, 12 reacciones, 3 fotólisis, 4 presets. Sin BD, backend, tests ni CI.
- Eₐ son valores pedagógicos (no reales); ΔHf° sí son datos estándar.

## Observaciones a FD01 / FD02 (v0.1)
1. Nombre inconsistente (Atom React Chamber / Atomic Reactor Chamber / Simulador v2.3 / QUIMI-K v2.2).
2. Equipo inconsistente (5 laptops, 4–5 roles, integrantes de otro proyecto en FD02, "Programación III").
3. Stack declarado Java/Spring Boot 2.5D ≠ real (React/Canvas 2D; v2 = Node/TS).
4. Objetivos no medibles (sin indicador/meta/plazo).
5. Problema sin fuentes estadísticas.
6. Público inconsistente (profesionales vs. escolares). v2: secundaria 1.º–5.º.
7. Alcance inflado (3D, PDF por correo, números cuánticos, editor de prácticas) → trabajo futuro.
8. Errores de costos: VPS 18×3 ≠ 40; SSL 0 unitario ≠ 150 total; laptops como gasto total; alquiler de oficina.
9. Beneficio financiero basado en supuesto arbitrario (7 % de pensiones de 60 alumnas).
10. Forma: versión 2.0 vs 0.1, "3 meses" en el índice, página en blanco.

## Dirección de arte
Ver `docs/diseno/direcciones-de-arte.md` (se documenta al elegir).
