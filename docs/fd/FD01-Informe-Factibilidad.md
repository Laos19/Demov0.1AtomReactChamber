---
title: "AtomReactChamber — Informe de Factibilidad"
version: "2.0"
fecha: "2026-11-07"
autora: "Adriana Rafaela Laos González (2023077474)"
---

# Cambios respecto a v0.1

> Lista para revisión de Adriana. Los números entre corchetes remiten a los defectos de `findings.md`.

1. **[1] Nombre único:** "AtomReactChamber" en todo el documento (antes: Atom React Chamber / Atomic Reactor Chamber / Simulador v2.3).
2. **[2] Equipo:** una sola integrante (Adriana) con roles rotativos; se eliminó a Antony Solorzano de la portada y la "redistribución entre 3 integrantes" del plan de riesgos.
3. **[3] Stack real:** React + Vite + TypeScript, Node 22 + Fastify, PostgreSQL (Neon), Liquibase, Terraform, GitHub Actions (antes: Java / Spring Boot / 2.5D).
4. **[4] Objetivos SMART** con indicador, meta, instrumento y plazo (antes: objetivos no medibles).
5. **[5] Problema con fuentes** (PISA 2022, ECE, Defensoría, metaanálisis) en la sección 3.1.
6. **[6] Público:** estudiantes de 1.º a 5.º de secundaria (antes: "profesionales de la rama").
7. **[7] Alcance:** laboratorio 3D, PDF por correo, números cuánticos y editor de prácticas pasan a **trabajo futuro**.
8. **[8] Costos corregidos:** laptop como **depreciación** (S/ 316,67, no S/ 19 000); se eliminó el alquiler de oficina; ambiente en S/ 0 con planes gratuitos; se corrigieron errores aritméticos (VPS 18 × 3 ≠ 40; SSL S/ 0 unitario ≠ S/ 150 total). Costo total: **S/ 4 253,98** (antes S/ 35 155,16).
9. **[9] Análisis financiero rehecho:** el beneficio ya no es el "7 % de pensiones de 60 alumnas", sino el **costo evitado de una licencia comercial** de laboratorio virtual con precio publicado, en tres escenarios, con fórmulas de B/C, VAN (10 %) y TIR.
10. **[10] Forma:** versión 2.0 registrada en control de versiones junto a 0.1; se quitó "3 meses" del índice y la página en blanco.
11. **Riesgos actualizados:** desarrolladora única, arranque en frío del plan gratuito, exactitud científica, datos de menores, límites de planes gratuitos.
12. **Legal:** se añade el nuevo Reglamento de la Ley 29733 (D. S. 016-2024-JUS) y el tratamiento de datos de menores de edad.

---

# Control de versiones

| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
|---|---|---|---|---|---|
| 0.1 | Adriana Laos y Antony Solorzano | — | — | 2026 | Versión original |
| 2.0 | Adriana Laos | Ing. Patrick Cuadros Quiroga (pendiente) | (pendiente) | 2026-11-07 | Corrección integral: nombre, equipo, stack, alcance, costos, análisis financiero, objetivos SMART y fuentes |

---

# 1. Descripción del proyecto

## 1.1 Nombre del proyecto

**AtomReactChamber: laboratorio virtual gamificado de química para estudiantes de secundaria del Perú.**
Asistente integrado: **Quimi**.

## 1.2 Duración del proyecto

16 semanas (un semestre académico de la UPT), organizadas en: análisis y BD (S1–S4), API (S5–S8),
frontend y simulador (S6–S12), automatizaciones e integraciones (S10–S14), piloto y documentación (S12–S16).

## 1.3 Descripción

AtomReactChamber es una aplicación web que convierte la tabla periódica en un **mapa de misiones**:
cada casilla es un nivel desbloqueable. Cada nivel es una **práctica de laboratorio guiada** dividida en
pasos; cada paso se **verifica con un simulador molecular 2D** que modela temperatura, presión, volumen,
luz UV y reacciones (combustión del H₂, Na + H₂O, Na + Cl₂, fotólisis). El asistente **Quimi**, basado
en reglas y en la base de datos, ofrece pistas escalonadas (pista → explicación → solución) que cuestan
XP, y un glosario con búsqueda de texto completo de PostgreSQL. La gamificación incluye XP, 1–3 estrellas,
insignias, rachas y ranking por aula. Cada nivel termina con un cuestionario con retroalimentación inmediata.
Hay tres roles: **estudiante**, **docente** (crea aulas con código de ingreso, asigna misiones y ve el
progreso) y **administrador**, además de un tablero de uso.

El proyecto se desarrolla en el curso **Base de Datos II**, por lo que el núcleo es un modelo relacional
en 3FN gestionado con **Liquibase**, con funciones, *triggers* y vistas para métricas.

**Fuera de alcance (trabajo futuro):** laboratorio 3D, reportes PDF por correo, números cuánticos,
editor de prácticas para docentes y asistente con LLM (previsto para la 3.ª unidad).

## 1.4 Objetivos

### 1.4.1 Objetivo general

Desarrollar e implementar, en 16 semanas, AtomReactChamber, un laboratorio virtual gamificado de química
con base de datos PostgreSQL, que permita a estudiantes de 1.º a 5.º de secundaria realizar prácticas
guiadas verificadas por un simulador molecular 2D y a los docentes hacer seguimiento del avance, logrando
en un piloto una tasa de niveles completados ≥ 60 % y una usabilidad SUS ≥ 70.

### 1.4.2 Objetivos específicos

| ID | Objetivo | Indicador | Meta | Instrumento | Plazo |
|---|---|---|---|---|---|
| OE-1 | Diseñar e implementar la BD en 3FN con migraciones versionadas. | Changesets Liquibase aplicados con *rollback* probado | 100 % de tablas, funciones, *triggers* y vistas versionados | Workflow `db.yml` | S4 |
| OE-2 | Publicar un catálogo de misiones alineadas al CNEB. | Niveles publicados y validados | ≥ 12 niveles en ≥ 4 temas | Vista de catálogo + checklist científico | S10 |
| OE-3 | Lograr que los estudiantes terminen las misiones. | Completados / iniciados | ≥ 60 % | Vista `v_metricas_nivel` | S14 |
| OE-4 | Mejorar el desempeño en el cuestionario de cierre. | % de aciertos, 1.er vs. último intento | +15 p. p. | Respuestas en BD | S14 |
| OE-5 | Que Quimi oriente sin resolver por el estudiante. | % de pasos con pista nivel "solución" | ≤ 30 % | Tabla `uso_pista` | S14 |
| OE-6 | Garantizar accesibilidad y usabilidad. | Lighthouse *Accessibility*; SUS | ≥ 90; ≥ 70 | Lighthouse CI; cuestionario SUS | S15 |
| OE-7 | Mantener disponibilidad en horario escolar. | Chequeos `/health` OK / totales | ≥ 99 % (07:00–18:00) | Workflow programado | S16 |
| OE-8 | Asegurar la calidad del software. | Cobertura backend; workflows en verde | ≥ 70 %; 100 % | Reporte de cobertura; GitHub Actions | S16 |
| OE-9 | Operar sin costo durante desarrollo y piloto. | Costo mensual de infraestructura | S/ 0 | Reporte de costos | S16 |

El detalle (línea base y objetivos de investigación) está en `docs/investigacion/problema-y-objetivos.md`.

# 2. Riesgos

| N.° | Riesgo | Probabilidad | Impacto | Plan de contingencia |
|---|---|---|---|---|
| 1 | **Desarrolladora única:** enfermedad o sobrecarga en semanas de exámenes detiene el proyecto. | Alta | Alto | Alcance priorizado (MVP: mapa + 3 misiones + Quimi + aula); tablero de tareas; automatización de pruebas y despliegue para reducir trabajo manual; documentación continua. |
| 2 | **Arranque en frío del plan gratuito de Render:** el servicio se suspende tras 15 min sin tráfico y tarda hasta ~1 min en despertar (Render, s. f.-a). | Alta | Medio | Modo demo offline del frontend; mensaje "despertando servidor"; ping previo a la clase; plan Starter (US$ 7/mes) si el piloto lo exige. |
| 3 | **Límites del plan gratuito de Neon** (100 CU-h/mes y 1 GB por proyecto; Neon, 2026). | Media | Medio | Índices y vistas eficientes; limpieza de eventos antiguos; respaldos con `pg_dump` en GitHub Actions; Terraform modular para migrar. |
| 4 | **Exactitud científica:** la simulación usa energías de activación pedagógicas (no reales). | Media | Alto | Declarar en la UI qué valores son didácticos; usar ΔHf° estándar; revisión de cada misión por un docente de Ciencia y Tecnología. |
| 5 | **Datos personales de menores de edad.** | Media | Alto | Minimización (alias, sin DNI ni fotos); consentimiento de padres para menores de 14 años (D. S. 016-2024-JUS); contraseñas con *hash*; HTTPS; roles. |
| 6 | **Conectividad irregular en IE** (71 % de IE públicas de secundaria con internet en 2022; Minedu, s. f.). | Media | Medio | Frontend liviano y modo demo sin API; sincronización al reconectar como mejora futura. |
| 7 | **Cambios en precios o condiciones de los planes gratuitos.** | Media | Medio | Infraestructura como código (Terraform) con módulos para Azure/AWS; reporte de costos en CI. |

# 3. Análisis de la situación actual

## 3.1 Planteamiento del problema

En PISA 2022 el Perú obtuvo 408 puntos en Ciencia (Minedu, 2023), frente a 485 del promedio OCDE
(Expreso, 2023); solo el 47 % de estudiantes alcanzó el nivel 2 o superior (OECD, 2023), y en el área
rural apenas el 21,8 % (Gestión, s. f., con datos de la Defensoría del Pueblo). Incluso Tacna, región
líder en las evaluaciones nacionales, tuvo solo 18,6 % de estudiantes de 2.º de secundaria en nivel
satisfactorio de Ciencia y Tecnología en la ECE 2019 (Andina, 2020).

El CNEB exige que el estudiante **indague mediante métodos científicos** (Minedu, 2016), pero muchas
prácticas de química son costosas o peligrosas (sodio metálico, cloro, hidrógeno) y el docente no tiene
datos del avance de cada estudiante. La evidencia indica que las simulaciones mejoran la enseñanza
tradicional, sobre todo en actividades de laboratorio (Rutten et al., 2012), y que la gamificación tiene
efectos positivos en el aprendizaje cognitivo (g = 0,49; Sailer & Homner, 2020).

La versión 0.1 de AtomReactChamber era un simulador en un único componente React con catálogo fijo en
el código, sin base de datos, sin usuarios, sin seguimiento docente y sin pruebas. La versión 2 resuelve
estos vacíos.

> El porcentaje de IE de secundaria con laboratorio de ciencias **no se encontró publicado** y se
> calculará a partir del Censo Educativo (objetivo de investigación OI-1).

## 3.2 Consideraciones de hardware y software

| Componente | Tecnología | Justificación |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript; Canvas 2D | Corre en cualquier navegador moderno; sin instalación. |
| Backend | Node 22 + TypeScript + Fastify 5 | Un solo lenguaje (TS) en todo el stack; bajo consumo de memoria (apto para 512 MB). |
| Base de datos | PostgreSQL (Neon, *serverless*) | Funciones, *triggers*, vistas y búsqueda de texto completo (glosario de Quimi). |
| Migraciones | Liquibase (SQL formateado con *rollback*) | Versionado auditable del esquema. |
| Infraestructura | Terraform (proveedores Neon y Render) | Reproducible y migrable a Azure/AWS. |
| CI/CD | GitHub Actions; GitHub Pages | Pruebas, migraciones, respaldos, *release* y documentación (TypeDoc). |
| Integraciones | Extensión VS Code, skill de Claude Code, servidor MCP | Acceso a la API desde herramientas de desarrollo. |
| Cliente mínimo | Equipo con navegador actualizado, 4 GB de RAM | Equipos típicos de aulas de innovación. |

# 4. Estudio de factibilidad

Se evalúa la viabilidad técnica, económica, operativa, legal, social y ambiental del proyecto para su
desarrollo en el curso y un piloto con al menos un aula de secundaria.

## 4.1 Factibilidad técnica

- **Lenguaje y arquitectura:** TypeScript en cliente y servidor; arquitectura cliente-servidor con API REST
  y autenticación JWT por roles.
- **Persistencia:** PostgreSQL con modelo en 3FN, funciones PL/pgSQL (XP, estrellas, rachas), *triggers*
  (auditoría, desbloqueo de niveles) y vistas de métricas.
- **Hardware mínimo del cliente:** navegador moderno y 4 GB de RAM; no requiere GPU dedicada.
- **Competencias:** la integrante domina React (v0.1 funcional) y PostgreSQL (curso Base de Datos II).
  El riesgo de aprendizaje está en Fastify y Terraform, mitigado con documentación oficial y plantillas.

**Conclusión:** técnicamente factible con herramientas libres o con plan gratuito.

## 4.2 Factibilidad económica

Supuestos generales: tipo de cambio **S/ 3,45 por US$** (dentro del rango de expectativas 2026 del BCRP;
verificar el valor del día en BCRPData); duración 4 meses (16 semanas).

### 4.2.1 Costos generales (equipo)

Se usa la laptop personal existente. No se compra equipo: se imputa la **depreciación** del periodo con la
tasa máxima de 25 % anual para equipos de procesamiento de datos (Reglamento de la LIR, art. 22; SUNAT, 2020).

Depreciación = valor × tasa anual × (meses / 12) = 3 800,00 × 0,25 × 4/12 = **S/ 316,67**

| Recurso | Cantidad | Valor (S/) | Tasa anual | Meses | Costo imputado (S/) |
|---|---|---|---|---|---|
| Laptop personal (existente) | 1 | 3 800,00 | 25 % | 4 | 316,67 |
| Google Drive / Docs, GitHub, VS Code | — | 0,00 | — | 4 | 0,00 |
| **Total** | | | | | **316,67** |

### 4.2.2 Costos operativos durante el desarrollo

Se elimina el alquiler de oficina: el trabajo se realiza en casa y en los laboratorios de la UPT.

| Servicio | Cálculo | Costo total (S/) |
|---|---|---|
| Electricidad | 0,065 kW × 256 h = 16,64 kWh × S/ 0,80/kWh *(supuesto; verificar recibo)* | 13,31 |
| Internet | 30 % del plan de S/ 70,00 × 4 meses | 84,00 |
| Entorno de desarrollo (GitHub, VS Code, Node, PostgreSQL local) | Software libre / gratuito | 0,00 |
| **Total** | | **97,31** |

### 4.2.3 Costos de personal

Una sola integrante con **roles rotativos**. Dedicación honesta: **16 h por semana × 16 semanas = 256 h**.
Tarifa de costo de oportunidad: **S/ 15,00/h** *(supuesto de practicante de ingeniería; como referencia, la
RMV de S/ 1 130 fijada por el D. S. 006-2024-TR equivale a unos S/ 5,40/h)*.

| Rol rotativo | Actividades | Horas | Subtotal (S/) |
|---|---|---|---|
| Analista / gestora | Requisitos, cronograma, FD01–FD05 | 32 | 480,00 |
| Diseñadora de BD | Modelo 3FN, Liquibase, funciones, *triggers*, vistas, semilla | 48 | 720,00 |
| Desarrolladora backend | API Fastify, JWT/roles, Quimi, aulas, métricas | 48 | 720,00 |
| Desarrolladora frontend | Mapa, niveles, simulador, gamificación, accesibilidad | 64 | 960,00 |
| DevOps | Terraform, GitHub Actions, despliegue, respaldos | 24 | 360,00 |
| QA | Pruebas unitarias, integración, E2E, piloto | 24 | 360,00 |
| Documentación y exposición | Manuales, presentación | 16 | 240,00 |
| **Total** | | **256** | **3 840,00** |

### 4.2.4 Costos del ambiente

**a) Desarrollo y piloto (planes gratuitos)**

| Servicio | Uso | Plan | Límite relevante | Costo (S/) |
|---|---|---|---|---|
| Neon | PostgreSQL | Free | 100 CU-h/mes y 1 GB por proyecto (Neon, 2026) | 0,00 |
| Render | API Fastify + sitio estático | Free | 750 h/mes; suspensión tras 15 min sin tráfico (Render, s. f.-a) | 0,00 |
| GitHub Pages | Documentación TypeDoc y demo | Free (repositorio público) | — | 0,00 |
| GitHub Actions | CI/CD, respaldos, reportes | Free (repositorio público) | — | 0,00 |
| Certificado TLS | HTTPS | Incluido en Render y GitHub Pages | — | 0,00 |
| Dominio | Subdominios `onrender.com` / `github.io` | — | — | 0,00 |
| **Total** | | | | **0,00** |

**b) Proyección para producción (plan de pago) — ESTIMADO, no es un gasto del proyecto**

| Servicio | Referencia | US$/mes | US$/año | S/ /año |
|---|---|---|---|---|
| API siempre activa | Render Starter, 512 MB (Render, s. f.-b) | 7,00 | 84,00 | 289,80 |
| PostgreSQL gestionado | Azure Database for PostgreSQL Flexible B1ms, ≈ US$ 12/mes, East US (Bytebase, 2026) | 12,00 | 144,00 | 496,80 |
| **Total estimado** | (no incluye almacenamiento adicional, respaldos ni transferencia) | **19,00** | **228,00** | **786,60** |

### 4.2.5 Costos totales del desarrollo del sistema

| Concepto | Costo (S/) |
|---|---|
| Costos generales (depreciación) | 316,67 |
| Costos operativos | 97,31 |
| Costos del ambiente (planes gratuitos) | 0,00 |
| Costos de personal | 3 840,00 |
| **Total general del proyecto** | **4 253,98** |

Verificación: 316,67 + 97,31 + 0,00 + 3 840,00 = 4 253,98.

**Comparación con v0.1:** S/ 35 155,16 → S/ 4 253,98. La diferencia se explica por: laptops como compra
total de 5 unidades (S/ 19 000) en lugar de depreciación de 1; alquiler de oficina (S/ 1 050) eliminado;
760 h de 5 roles en lugar de 256 h reales de 1 persona; y servicios de pago sustituidos por planes gratuitos.
Además, la tabla de ambiente de v0.1 tenía errores: VPS S/ 18 × 3 meses = **S/ 54** (no S/ 40) y SSL con
costo unitario S/ 0 pero total S/ 150.

## 4.3 Factibilidad operativa

- El docente crea un **aula** y comparte un **código de ingreso**; asigna misiones y ve el avance por
  estudiante y paso, sin trámites administrativos.
- El estudiante entra desde el navegador del aula de innovación o de su casa; no instala nada.
- El administrador gestiona usuarios y roles. Los respaldos y despliegues son automáticos (GitHub Actions).
- El uso previsto es **complementario** al laboratorio físico y a la clase, coherente con la evidencia de
  que las simulaciones funcionan mejor con guía docente (Smetana & Bell, 2012).

**Conclusión:** operativamente factible; requiere capacitar al docente (≈ 30 min) y medir con OE-6 y OS-9.

## 4.4 Factibilidad legal

- **Ley N.° 29733, Ley de Protección de Datos Personales** (Congreso de la República, 2011), y su **nuevo
  Reglamento, D. S. N.° 016-2024-JUS**, publicado el 30 de noviembre de 2024, que derogó el D. S.
  003-2013-JUS. Según el Minjus (2024), el tratamiento de datos de niñas, niños y adolescentes requiere el
  consentimiento de quienes ejercen la patria potestad, salvo los mayores de 14 años, que pueden consentir
  por sí mismos; las políticas de privacidad deben usar lenguaje sencillo y adecuado a su edad.
  *Aplicación:* alias en lugar de nombre completo en el ranking, sin DNI ni fotografías, consentimiento de
  padres para 1.º–2.º de secundaria (12–13 años), política de privacidad en lenguaje simple, cifrado en
  tránsito y contraseñas con *hash*.
- **Decreto Legislativo N.° 822, Ley sobre el Derecho de Autor** (1996): el código, contenidos e
  ilustraciones son obras propias o con licencias compatibles; se citan las fuentes de datos químicos.
- **Licencias de terceros:** React, Fastify, PostgreSQL y Liquibase son de código abierto (MIT, PostgreSQL
  License, Apache 2.0); se respetan sus condiciones.

**Conclusión:** legalmente factible si se implementan las medidas de protección de datos de menores.

## 4.5 Factibilidad social

El público son **estudiantes de 1.º a 5.º de secundaria** y sus docentes de Ciencia y Tecnología. El
proyecto aporta a reducir la brecha de oportunidades de experimentación, especialmente donde no hay
laboratorio o reactivos, en un contexto en el que solo el 21,8 % de estudiantes rurales alcanza el nivel 2
de ciencias en PISA 2022 (Gestión, s. f.). Está alineado al CNEB (Minedu, 2016), está en español y es
gratuito para la IE. **Conclusión:** socialmente factible y pertinente.

## 4.6 Factibilidad ambiental

Las prácticas virtuales no generan residuos químicos ni consumen reactivos; las guías y reportes son
digitales. El impacto ambiental del proyecto se limita al consumo eléctrico del equipo de desarrollo
(≈ 16,64 kWh en todo el desarrollo) y de servidores compartidos en la nube. **Conclusión:** factible.

# 5. Análisis financiero

## 5.1 Justificación de la inversión

### 5.1.1 Beneficios del proyecto

- **Tangibles:** costo evitado de licencias de simuladores comerciales; reactivos y material no consumidos
  en prácticas peligrosas; tiempo docente ahorrado en corrección (cuestionario autocalificado).
- **Intangibles:** mayor acceso a la experimentación, seguridad, motivación por gamificación, datos de
  avance para el docente, innovación educativa y aprendizaje de Base de Datos II aplicado.

### 5.1.2 Criterios de inversión (proyección a 3 años)

**Supuestos (transparentes y modificables):**

| Supuesto | Valor | Fuente / justificación |
|---|---|---|
| Inversión inicial (año 0) | S/ 4 253,98 | Sección 4.2.5 |
| Costo de operación anual (años 1–3) | S/ 786,60 | Proyección de pago, sección 4.2.4 b |
| Precio de referencia de una licencia comercial | US$ 5 000/año = S/ 17 250,00 | Labster indica que sus contratos anuales "típicamente comienzan en US$ 5 000" (Labster, s. f.) |
| Beneficio anual = costo evitado | Fracción de la licencia de referencia que AtomReactChamber sustituye | Ver escenarios |
| Tasa de descuento | 10 % anual | Costo de oportunidad referencial (igual que v0.1) |
| Horizonte | 3 años | Igual que v0.1 |

**Escenarios:** AtomReactChamber no cubre todo lo que ofrece un producto comercial (que abarca biología,
física, etc.), por eso se valora solo una fracción del costo evitado:

- **Optimista (100 %):** la IE habría contratado la licencia y AtomReactChamber la sustituye por completo.
- **Base (25 %)** — escenario recomendado: cubre solo la parte de química del área.
- **Pesimista (10 %).**

**Fórmulas**

- Flujo neto anual: FNₜ = Bₜ − Cₜ
- VAN = −I₀ + Σₜ₌₁³ FNₜ / (1 + i)ᵗ, con i = 0,10
- B/C = [Σ Bₜ / (1 + i)ᵗ] / [I₀ + Σ Cₜ / (1 + i)ᵗ]
- TIR: tasa r tal que −I₀ + Σₜ₌₁³ FNₜ / (1 + r)ᵗ = 0 (resuelta numéricamente por bisección)
- Factor de actualización (3 años, 10 %): Σ 1/1,1ᵗ = 0,9091 + 0,8264 + 0,7513 = 2,4869

**Escenario base (25 %), paso a paso**

- B = 0,25 × 17 250,00 = S/ 4 312,50 por año; C = S/ 786,60; FN = S/ 3 525,90
- VAN = −4 253,98 + 3 525,90/1,1 + 3 525,90/1,1² + 3 525,90/1,1³
  = −4 253,98 + 3 205,36 + 2 913,97 + 2 649,06 = **S/ 4 514,41**
- VA beneficios = 3 920,45 + 3 564,05 + 3 240,05 = 10 724,55
- VA costos = 4 253,98 + (715,09 + 650,08 + 590,98) = 6 210,14
- B/C = 10 724,55 / 6 210,14 = **1,727**
- TIR = **64,14 %**

**Resumen de escenarios**

| Escenario | Beneficio anual (S/) | Flujo neto anual (S/) | VAN 10 % (S/) | B/C | TIR | Decisión |
|---|---|---|---|---|---|---|
| Optimista (100 %) | 17 250,00 | 16 463,40 | 36 688,06 | 6,908 | 383,59 % | Viable |
| **Base (25 %)** | **4 312,50** | **3 525,90** | **4 514,41** | **1,727** | **64,14 %** | **Viable** |
| Pesimista (10 %) | 1 725,00 | 938,40 | −1 920,32 | 0,691 | No existe TIR positiva | No viable financieramente |

**Punto de equilibrio:** el beneficio anual que hace VAN = 0 es
B* = I₀ / 2,4869 + C = 4 253,98 / 2,4869 + 786,60 = **S/ 2 497,19 por año**, es decir, el **14,5 %** del
precio de referencia de una licencia comercial. Si una IE valora AtomReactChamber en más de ese monto
(por ejemplo, porque reemplaza al menos esa fracción de un producto de pago), el proyecto es rentable.

**Interpretación:** en el escenario base, el proyecto recupera la inversión y genera VAN positivo con una
TIR superior a la tasa de descuento. El escenario pesimista muestra que la viabilidad **depende de que el
producto sustituya un gasto real**; si no lo hace, el proyecto se justifica por su valor social y académico,
no financiero. Nota sobre v0.1: su cálculo de VAN (S/ 53 625,46) y TIR (85,69 %) era aritméticamente
correcto, pero partía de un beneficio arbitrario (7 % de pensiones de 60 alumnas) y su B/C (1,015) no
estaba actualizado ni consideraba los 3 años.

# 6. Conclusiones

1. AtomReactChamber es **técnicamente factible** con un stack TypeScript + PostgreSQL desplegado en planes
   gratuitos (Neon, Render, GitHub Pages) y migrable a Azure/AWS con Terraform.
2. El costo real de desarrollo es **S/ 4 253,98** (una integrante, 256 h, depreciación de equipo y
   servicios gratuitos), y el costo de infraestructura durante el desarrollo y piloto es **S/ 0**.
3. En el escenario base (sustitución del 25 % de una licencia comercial de referencia), el proyecto tiene
   **VAN = S/ 4 514,41, B/C = 1,727 y TIR = 64,14 %**; su punto de equilibrio es el 14,5 % de dicha licencia.
4. Es **operativa, legal, social y ambientalmente factible**, siempre que se cumplan las medidas del
   D. S. 016-2024-JUS para datos de menores y se use como complemento guiado por el docente.
5. Los objetivos son medibles desde la propia base de datos; el piloto (S12–S15) confirmará las metas.

# Referencias

Andina. (2020). *Tacna, Moquegua y Arequipa lideran la mejora de aprendizajes a escala nacional*. https://andina.pe/ingles/noticia-tacna-moquegua-y-arequipa-lideran-mejora-aprendizajes-a-escala-nacional-800056.aspx

Bytebase. (2026). *B1ms pricing (Azure Database for PostgreSQL / MySQL Flexible Server)* [Precios indicativos al 8 de julio de 2026]. https://www.bytebase.com/dbcost/azure-flexible/instance/B1ms/

Congreso de la República del Perú. (2011). *Ley N.° 29733, Ley de Protección de Datos Personales*. https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales/243470-29733

Expreso. (2023). *PISA 2022 Perú: se requiere eficiencia en el gasto en educación*. https://www.expreso.com.pe/opinion/pisa-2022-peru-se-requiere-eficiencia-en-el-gasto-en-educacion/

Gestión. (s. f.). [Nota sobre resultados de PISA 2022 con datos de la Defensoría del Pueblo; título y fecha por confirmar]. https://gestion.pe/peru/lea-tambien-modifican-reglamento-de-la-ley-de-reforma-magisterial-cuales-son-los-cambios-educacion-ocde-noticia/

Labster. (s. f.). *Precios*. Recuperado el 7 de noviembre de 2026, de https://www.labster.com/es/precios

Ministerio de Educación. (2016). *Currículo Nacional de la Educación Básica*. https://repositorio.minedu.gob.pe/handle/20.500.12799/4551

Ministerio de Educación. (2023). *Pisa 2022: el Perú mantiene sus resultados en las competencias de lectura y ciencia*. https://www.gob.pe/institucion/minedu/noticias/877904-pisa-2022-el-peru-mantiene-sus-resultados-en-las-competencias-de-lectura-y-ciencia

Ministerio de Educación, Unidad de Estadística Educativa. (s. f.). *Edudatos 45: Conectividad*. https://escale.minedu.gob.pe/documents/inicio/Analisis/Edudatos/Edudatos%2045%20-%20Conectividad.pdf

Ministerio de Justicia y Derechos Humanos. (2024). *Ejecutivo aprueba nuevo reglamento de la Ley de Protección de Datos Personales*. https://www.gob.pe/institucion/minjus/noticias/1067368-ejecutivo-aprueba-nuevo-reglamento-de-la-ley-de-proteccion-de-datos-personales

Ministerio de Justicia y Derechos Humanos. (2024). *Decreto Supremo N.° 016-2024-JUS que aprueba el Reglamento de la Ley N.° 29733*. https://www.congreso.gob.pe/Docs/DGP/DIDP/files/ds_016-2024-jus.pdf

Ministerio de Trabajo y Promoción del Empleo. (2024). *Decreto Supremo N.° 006-2024-TR* [Remuneración mínima vital de S/ 1 130]. https://img.lpderecho.pe/wp-content/uploads/2024/12/Decreto-Supremo-006-2024-TR-LPDerecho.pdf

Neon. (2026). *Free plan limits and quotas*. https://neon.com/faqs/free-plan-limits-and-quotas

OECD. (2023). *PISA 2022 results (Volume I and II) – Country notes: Peru*. https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/peru_3e71791c-en.html

Presidencia del Consejo de Ministros. (1996). *Decreto Legislativo N.° 822, Ley sobre el Derecho de Autor*. https://www.gob.pe/institucion/indecopi/normas-legales/1670023-822

Render. (s. f.-a). *Deploy for free*. https://render.com/docs/free

Render. (s. f.-b). *Pricing*. https://render.com/pricing

Rutten, N., van Joolingen, W. R., & van der Veen, J. T. (2012). The learning effects of computer simulations in science education. *Computers & Education, 58*(1), 136–153. https://learntechlib.org/p/50686

Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*, 77–112. https://link.springer.com/article/10.1007/s10648-019-09498-w

Smetana, L. K., & Bell, R. L. (2012). Computer simulations to support science instruction and learning: A critical review of the literature. *International Journal of Science Education, 34*(9), 1337–1370. https://eepro.naaee.org/research/eeresearch/computer-simulations-support-science-teaching

Superintendencia Nacional de Aduanas y de Administración Tributaria. (2020). *Informe N.° 151-2020-SUNAT/7T0000* [Tasa máxima de depreciación de equipos de procesamiento de datos; confirmar que es el informe que cita la tasa del 25 %]. https://www.sunat.gob.pe/legislacion/oficios/2020/informe-oficios/i151-2020-7T0000.pdf
