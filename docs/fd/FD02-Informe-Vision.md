---
title: "AtomReactChamber — Documento de Visión"
version: "2.0"
fecha: "2026-11-07"
autora: "Adriana Rafaela Laos González (2023077474)"
---

# Cambios respecto a v0.1

> Lista para revisión de Adriana. Los números entre corchetes remiten a los defectos de `findings.md`.

1. **[1] Nombre:** "AtomReactChamber" en todo el documento (antes: "QUIMI-K", "Quimi-K", "Simulador de laboratorio virtual v2.2"). **Quimi** es el nombre del asistente, no del sistema.
2. **[2] Equipo:** solo Adriana Rafaela Laos González. Se eliminaron Antony Solorzano (portada), Gabriela Cohaila, Vincenzo Llanos y Edison Meneses (perfil del equipo) y la mención al curso "Programación III".
3. **[3] Stack real:** React + Vite + TypeScript, Node 22 + Fastify, PostgreSQL (Neon), Liquibase, Terraform, GitHub Actions; simulador **2D molecular** (se elimina "2D isométrico").
4. **[4] Objetivos SMART** añadidos (sección 1.2.1), idénticos a los del FD01 v2.0.
5. **[5] Problema con fuentes** (PISA 2022, ECE 2019 Tacna, Defensoría, metaanálisis).
6. **[6] Público:** estudiantes de 1.º a 5.º de secundaria, área Ciencia y Tecnología (CNEB).
7. **[7] Alcance:** reportes PDF por correo, laboratorio 3D y creación de prácticas por el docente pasan a **"No incluye / trabajo futuro"**; se añaden números cuánticos y LLM como trabajo futuro.
8. **[8] Costos** actualizados al FD01 v2.0 (S/ 4 253,98; ambiente S/ 0).
9. **Nuevas características:** mapa de misiones con forma de tabla periódica, gamificación (XP, estrellas, insignias, rachas, ranking por aula), pistas escalonadas que cuestan XP, glosario con búsqueda de texto completo, aulas con código de ingreso, tablero de uso, integraciones (VS Code, skill de Claude Code, MCP, GitHub).
10. **Rangos de calidad** con métricas verificables (SUS, Lighthouse, disponibilidad, cobertura) y prioridades corregidas (usabilidad y seguridad ya no son "Baja").
11. **Legal:** se añade el D. S. 016-2024-JUS (datos de menores).
12. **[10] Forma:** versión 2.0 registrada junto a 0.1; referencias en APA 7.

---

# Control de versiones

| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
|---|---|---|---|---|---|
| 0.1 | Adriana Laos | — | — | 2026 | Primera versión del proyecto |
| 2.0 | Adriana Laos | Ing. Patrick Cuadros Quiroga (pendiente) | (pendiente) | 2026-11-07 | Corrección integral: nombre, equipo, alcance, gamificación, roles, objetivos SMART y fuentes |

---

# 1. Introducción

## 1.1 Propósito

Definir la visión de **AtomReactChamber**, un laboratorio virtual gamificado de química para estudiantes
de 1.º a 5.º de secundaria del Perú, que permite realizar prácticas guiadas verificadas por un simulador
molecular 2D, con apoyo del asistente **Quimi** y seguimiento del docente. El documento establece el
problema, los interesados, las características, las restricciones y los niveles de calidad que guían el
desarrollo en el curso Base de Datos II.

## 1.2 Alcance

| N.° | Descripción | Incluye | No incluye (trabajo futuro) |
|---|---|---|---|
| 001 | Aplicación web cliente-servidor (React + Fastify + PostgreSQL), sin instalación local. | ✔ | |
| 002 | Mapa de misiones con forma de tabla periódica; cada casilla es un nivel desbloqueable. | ✔ | |
| 003 | Niveles = prácticas guiadas por pasos, verificadas por el simulador molecular 2D (T, P, V, luz UV, reacciones). | ✔ | |
| 004 | Asistente Quimi basado en reglas: pistas escalonadas (pista → explicación → solución) con costo en XP y glosario con búsqueda de texto completo. | ✔ | |
| 005 | Gamificación: XP, 1–3 estrellas, insignias, rachas y ranking por aula. | ✔ | |
| 006 | Cuestionario de cierre por nivel con retroalimentación inmediata. | ✔ | |
| 007 | Roles estudiante, docente y administrador; aulas con código de ingreso; asignación de misiones; progreso. | ✔ | |
| 008 | Tablero de uso (métricas desde vistas de la BD). | ✔ | |
| 009 | Laboratorio libre (simulador sin guía). | ✔ | |
| 010 | Integraciones: extensión VS Code, skill de Claude Code, servidor MCP, GitHub Actions/Pages. | ✔ | |
| 011 | Laboratorio en 3D. | | ✔ |
| 012 | Reportes PDF enviados por correo. | | ✔ |
| 013 | Módulo de números cuánticos. | | ✔ |
| 014 | Editor de prácticas para docentes. | | ✔ |
| 015 | Quimi con modelo de lenguaje (LLM) — previsto para la 3.ª unidad. | | ✔ |

### 1.2.1 Objetivos SMART

**Objetivo general:** desarrollar e implementar, en 16 semanas, AtomReactChamber con base de datos
PostgreSQL, logrando en un piloto una tasa de niveles completados ≥ 60 % y una usabilidad SUS ≥ 70.

| ID | Objetivo | Indicador | Línea base | Meta | Instrumento | Plazo |
|---|---|---|---|---|---|---|
| OS-1 | Catálogo de misiones alineadas al CNEB | Niveles publicados y validados | v0.1: 0 niveles guiados | ≥ 12 niveles en ≥ 4 temas | Vista de catálogo + checklist | S10 |
| OS-2 | Finalización de misiones | Completados / iniciados | Sistema nuevo | ≥ 60 % | `v_metricas_nivel` | S14 |
| OS-3 | Desempeño en cuestionario | % aciertos 1.er vs. último intento | 1.er intento del piloto | +15 p. p. | Respuestas en BD | S14 |
| OS-4 | Duración de pasos | Mediana de tiempo por paso | Sistema nuevo | ≤ 3 min | `intento_paso` | S14 |
| OS-5 | Quimi orienta sin resolver | % de pasos con pista "solución" | Sistema nuevo | ≤ 30 % | `uso_pista` | S14 |
| OS-6 | Accesibilidad | Lighthouse *Accessibility* | No medido | ≥ 90 en 5 vistas | Lighthouse CI | S12 |
| OS-7 | Disponibilidad | Chequeos `/health` OK / total | Sistema nuevo | ≥ 99 % (07:00–18:00) | Workflow programado | S16 |
| OS-8 | Calidad del software | Cobertura backend; workflows en verde | 0 pruebas | ≥ 70 %; 100 % | Reporte de cobertura | S16 |
| OS-9 | Gestión docente | Docentes que crean aula y asignan misión en ≤ 5 min | Sistema nuevo | 100 % (n ≥ 2) | Prueba de tarea | S15 |
| OS-10 | Costo de operación | Costo mensual de infraestructura | S/ 245 (v0.1) | S/ 0 | Reporte de costos | S16 |
| OI-3 | Usabilidad percibida | SUS promedio | Referencia ≈ 68 (Bangor et al., 2009) | ≥ 70 | Cuestionario SUS | S15 |

## 1.3 Definiciones, siglas y abreviaturas

| Término | Descripción |
|---|---|
| API | Interfaz de programación que comunica el frontend con el backend (REST/JSON). |
| Backend | Servidor Node 22 + Fastify que aplica reglas de negocio, autenticación y acceso a la BD. |
| Frontend | Aplicación React + Vite + TypeScript que se ejecuta en el navegador. |
| BD | Base de datos PostgreSQL en 3FN, gestionada con Liquibase. |
| CNEB | Currículo Nacional de la Educación Básica (Minedu, 2016). |
| Misión / nivel | Práctica de laboratorio guiada, representada como casilla del mapa. |
| Paso | Unidad de una misión; se valida con una condición del simulador (p. ej., "T ≥ 500 K y se formó H₂O"). |
| Quimi | Asistente basado en reglas que entrega pistas escalonadas y consulta el glosario. |
| XP | Puntos de experiencia; se ganan al completar pasos y se gastan en pistas. |
| Racha | Días consecutivos con al menos un paso completado. |
| Aula | Grupo creado por un docente; los estudiantes ingresan con un código. |
| JWT | *JSON Web Token*, credencial firmada para autenticar solicitudes. |
| FTS | *Full-Text Search*, búsqueda de texto completo de PostgreSQL. |
| SUS | *System Usability Scale*, cuestionario de usabilidad de 10 ítems (0–100). |
| MCP | *Model Context Protocol*, protocolo para exponer la API a agentes de IA. |
| IaC | Infraestructura como código (Terraform). |
| CI/CD | Integración y despliegue continuos (GitHub Actions). |
| Rol | Nivel de acceso: estudiante, docente o administrador. |

## 1.4 Referencias

Ver secciones 14 (Bibliografía) y 15 (Webgrafía). Documentos del proyecto: FD01 v2.0 Informe de
Factibilidad; `docs/investigacion/problema-y-objetivos.md`.

# 2. Posicionamiento

## 2.1 Oportunidad de negocio

En PISA 2022 solo el 47 % de los estudiantes peruanos alcanzó el nivel 2 o superior en ciencias (OECD,
2023), y en el área rural el 21,8 % (Gestión, s. f.). Los simuladores existentes son gratuitos pero
genéricos y sin seguimiento por aula (p. ej., PhET, de la Universidad de Colorado Boulder), o comerciales,
con contratos anuales que "típicamente comienzan en US$ 5 000" (Labster, s. f.), en inglés o sin vínculo
con el CNEB.

AtomReactChamber ocupa el espacio intermedio: **gratuito para la IE, en español, alineado al CNEB, con
práctica guiada, gamificación y datos para el docente**, ejecutable en el navegador de un aula de
innovación. No compite en amplitud temática con los grandes simuladores, sino en pertinencia curricular,
seguimiento pedagógico y costo cero de operación en su fase inicial.

## 2.2 Definición del problema

### 2.2.1 El problema

Los estudiantes de 1.º a 5.º de secundaria tienen pocas oportunidades de experimentar con fenómenos
químicos: muchas prácticas son costosas o peligrosas, y el docente no cuenta con datos del avance de cada
estudiante. Esto limita la competencia *"Indaga mediante métodos científicos"* del CNEB (Minedu, 2016).
Incluso en Tacna, región líder en las evaluaciones nacionales, solo el 18,6 % de los estudiantes de 2.º de
secundaria alcanzó el nivel satisfactorio en Ciencia y Tecnología en la ECE 2019 (Andina, 2020).

| Elemento | Descripción |
|---|---|
| El problema de | pocas oportunidades de experimentación química guiada y medible |
| afecta a | estudiantes de 1.º–5.º de secundaria y docentes de Ciencia y Tecnología |
| cuyo impacto es | enseñanza expositiva, bajo logro en ciencia y desmotivación |
| una solución exitosa sería | un laboratorio virtual gratuito, guiado, gamificado y con seguimiento docente |

### 2.2.2 A quiénes afecta

- **Estudiantes** (12–17 años), especialmente de IE públicas y rurales, que aprenden química sin experimentar.
- **Docentes de Ciencia y Tecnología**, que no pueden ejecutar prácticas peligrosas o costosas ni tienen datos de avance.
- **Instituciones educativas**, que necesitan alternativas de bajo costo que complementen el laboratorio físico.

# 3. Impacto

- **Aprendizaje:** se espera una ganancia normalizada ⟨g⟩ ≥ 0,30 entre pre y post test (OI-2), coherente
  con los efectos positivos reportados para simulaciones (Rutten et al., 2012) y gamificación
  (g = 0,49, Sailer & Homner, 2020; g = 0,782, Zeng et al., 2024).
- **Equidad:** acceso a prácticas que requieren reactivos peligrosos o caros, sin costo para la IE.
- **Gestión docente:** progreso por estudiante y paso, uso de pistas y resultados del cuestionario en tiempo real.
- **Seguridad y ambiente:** cero residuos químicos y cero riesgo físico en las prácticas virtuales.

# 4. La solución

AtomReactChamber presenta un **mapa de misiones** con forma de tabla periódica. Al elegir una casilla
desbloqueada, el estudiante entra a un nivel con objetivo, materiales y pasos. Cada paso se valida
automáticamente por el **simulador molecular 2D** (por ejemplo, "eleva la temperatura hasta que el H₂ y el
O₂ reaccionen"). Si se atasca, **Quimi** ofrece una pista, luego una explicación y, como último recurso,
la solución, cada una con un costo creciente de XP. Al terminar, responde un **cuestionario** con
retroalimentación inmediata y obtiene de 1 a 3 estrellas, XP e insignias; su racha y su posición en el
ranking del aula se actualizan mediante funciones y *triggers* de la BD.

El **docente** crea un aula, comparte el código, asigna misiones y revisa un panel con el avance. El
**administrador** gestiona usuarios y contenido. Todo se despliega automáticamente con GitHub Actions en
Neon (BD), Render (API y sitio) y GitHub Pages (documentación y demo).

# 5. Descripción de los interesados y usuarios

## 5.1 Resumen de los interesados

| Interesado | Descripción |
|---|---|
| Docente del curso | Ing. Patrick Cuadros Quiroga. Orienta, supervisa y evalúa el proyecto en Base de Datos II. |
| Desarrolladora | Adriana Rafaela Laos González: análisis, BD, desarrollo, pruebas, despliegue y documentación (roles rotativos). |
| Institución educativa | IE de secundaria que usa la plataforma como complemento de Ciencia y Tecnología. |
| Docente de Ciencia y Tecnología | Crea aulas, asigna misiones y revisa el progreso. |
| Estudiantes | Usuarios principales (1.º–5.º de secundaria). |
| Padres de familia | Otorgan el consentimiento para el tratamiento de datos de menores de 14 años (D. S. 016-2024-JUS). |
| Validador de contenido científico | Docente de química que revisa las misiones antes de publicarlas. |

## 5.2 Resumen de los usuarios

| Usuario | Descripción | Frecuencia de uso | Objetivo principal |
|---|---|---|---|
| Estudiante | Resuelve misiones, usa a Quimi, responde cuestionarios, compite en el ranking. | Alta durante clases y tareas | Aprender química experimentando. |
| Docente | Crea aulas, asigna misiones, revisa el panel de progreso. | Alta durante sesiones | Guiar y evaluar con datos. |
| Administrador | Gestiona usuarios, roles, catálogo y glosario. | Media | Mantener la plataforma ordenada y segura. |

## 5.3 Entorno de usuario

### 5.3.1 Entorno físico

| Aspecto | Descripción |
|---|---|
| Ubicación | Aula de innovación, aula con proyector o casa del estudiante. |
| Equipo | Computadora o laptop con navegador actualizado; uso en tableta como mejora futura. |
| Sistema operativo | Windows, Linux, macOS o ChromeOS. |
| Periféricos | Teclado y mouse (o panel táctil); pantalla de 1280 × 720 o superior recomendada. |
| Supervisión | El docente acompaña la sesión y revisa el panel en tiempo real. |

### 5.3.2 Entorno técnico

| Aspecto | Descripción |
|---|---|
| Conexión | Requerida para guardar progreso; **modo demo** sin API para uso sin conexión. |
| Software | Navegador moderno (Chrome, Edge, Firefox, Safari). |
| Instalación | No requiere. |
| Memoria / CPU | 4 GB de RAM; procesador de gama básica. |
| Gráficos | Canvas 2D; no requiere GPU dedicada. |
| Servidor | API Fastify en Render; PostgreSQL en Neon; documentación en GitHub Pages. |
| Seguridad | HTTPS, JWT, contraseñas con *hash*, control de acceso por rol. |

## 5.4 Perfiles de los interesados

**Interesado 1: Docente del curso**

| Atributo | Descripción |
|---|---|
| Rol | Supervisor y evaluador |
| Organización | Universidad Privada de Tacna – Facultad de Ingeniería – EPIS |
| Responsabilidades | Guiar el proyecto, aprobar entregables FD01–FD05 y evaluar el producto. |
| Expectativas | Modelo de datos sólido, documentación coherente y software funcional. |
| Influencia | Alta |
| Participación | Semanal |
| Comunicación | Clases, correo institucional, GitHub |

**Interesado 2: Desarrolladora**

| Atributo | Descripción |
|---|---|
| Rol | Desarrolladora única con roles rotativos |
| Integrante | **Laos González, Adriana Rafaela (2023077474)** — gestora, analista, diseñadora de BD, desarrolladora backend y frontend, DevOps, QA y documentadora |
| Organización | UPT – Estudiante de Ingeniería de Sistemas |
| Responsabilidades | Diseñar, implementar, probar, desplegar y documentar AtomReactChamber. |
| Expectativas | Aplicar los contenidos de **Base de Datos II** (modelado, SQL avanzado, migraciones, respaldos) en un producto real. |
| Influencia | Alta |
| Participación | Diaria |
| Comunicación | GitHub (issues, PR), correo institucional |

**Interesado 3: Institución educativa**

| Atributo | Descripción |
|---|---|
| Rol | Entidad beneficiaria |
| Responsabilidades | Facilitar equipos, conexión y tiempo de clase; autorizar el piloto. |
| Expectativas | Herramienta gratuita, segura y alineada al CNEB. |
| Influencia | Media |
| Participación | Ocasional (piloto y presentación) |

**Interesado 4: Docente de Ciencia y Tecnología**

| Atributo | Descripción |
|---|---|
| Rol | Usuario docente |
| Responsabilidades | Crear aulas, asignar misiones, acompañar y evaluar. |
| Expectativas | Panel claro, misiones correctas y fáciles de asignar. |
| Influencia | Alta |
| Participación | Alta durante el piloto |

**Interesado 5: Estudiante**

| Atributo | Descripción |
|---|---|
| Rol | Usuario y beneficiario directo |
| Responsabilidades | Resolver misiones, usar pistas con criterio y responder cuestionarios. |
| Expectativas | Plataforma visual, retadora y entretenida que le ayude a entender la química. |
| Influencia | Alta |
| Participación | Alta durante clases y tareas |

**Interesado 6: Padres de familia**

| Atributo | Descripción |
|---|---|
| Rol | Responsables del consentimiento de datos de menores de 14 años |
| Expectativas | Uso seguro y mínimo de los datos de sus hijos. |
| Influencia | Media |

## 5.5 Perfiles de los usuarios

**Usuario 1: Estudiante**

| Atributo | Descripción |
|---|---|
| Edad típica | 12 a 17 años (1.º a 5.º de secundaria) |
| Conocimientos previos | Nociones de materia y tabla periódica según grado; manejo básico del navegador. |
| Tareas típicas | Ingresar con código de aula, elegir misión, completar pasos en el simulador, pedir pistas, responder el cuestionario, revisar perfil e insignias. |
| Necesidades | Instrucciones breves, retroalimentación inmediata, lenguaje sencillo, accesibilidad (teclado, contraste). |

**Usuario 2: Docente de Ciencia y Tecnología**

| Atributo | Descripción |
|---|---|
| Edad típica | 25 a 65 años |
| Conocimientos previos | Dominio del área; manejo básico de plataformas educativas. |
| Tareas típicas | Crear aula, compartir código, asignar misiones, revisar progreso y uso de pistas. |
| Necesidades | Panel claro, datos por estudiante y paso, poca configuración. |

**Usuario 3: Administrador**

| Atributo | Descripción |
|---|---|
| Edad típica | 25 a 60 años |
| Conocimientos previos | Gestión de sistemas web. |
| Tareas típicas | Gestionar cuentas y roles, publicar misiones validadas, mantener el glosario. |
| Necesidades | Seguridad, auditoría y facilidad de administración. |

### 5.5.1 Necesidades de los interesados y usuarios

| Necesidad | Prioridad | Solución propuesta |
|---|---|---|
| Experimentar sin riesgo ni reactivos | Alta | Simulador molecular 2D con pasos verificables |
| Saber qué hacer en cada momento | Alta | Pasos guiados y pistas escalonadas de Quimi |
| Motivación sostenida | Alta | XP, estrellas, insignias, rachas, ranking por aula |
| Seguimiento del avance | Alta | Aulas, asignaciones y panel docente con vistas SQL |
| Protección de datos de menores | Alta | Alias, minimización, consentimiento, roles, HTTPS |
| Consulta de conceptos | Media | Glosario con búsqueda de texto completo |
| Uso con conexión inestable | Media | Modo demo offline del frontend |

# 6. Vista general del producto

## 6.1 Perspectiva del producto

AtomReactChamber es un sistema independiente compuesto por: (1) frontend React servido como sitio
estático; (2) API Fastify; (3) base de datos PostgreSQL con lógica en funciones, *triggers* y vistas;
(4) automatizaciones en GitHub Actions; e (5) integraciones (extensión VS Code, skill de Claude Code y
servidor MCP) que consumen la misma API. Complementa —no reemplaza— al laboratorio físico y a la clase.

## 6.2 Resumen de capacidades

| Capacidad | Beneficio |
|---|---|
| Mapa de misiones (tabla periódica) | Progresión clara y motivadora. |
| Prácticas guiadas verificadas por simulador | Experimentación segura con validación automática. |
| Quimi (pistas escalonadas + glosario FTS) | Ayuda graduada que no regala la respuesta. |
| Gamificación (XP, estrellas, insignias, rachas, ranking) | Motivación y práctica sostenida. |
| Cuestionarios con retroalimentación inmediata | Evaluación formativa autocalificada. |
| Aulas y asignaciones | Gestión docente simple con código de ingreso. |
| Tablero de uso | Métricas de finalización, tiempo por paso y uso de pistas. |
| Laboratorio libre | Exploración sin guía. |
| Integraciones (VS Code, Claude Code, MCP) | Acceso a la API desde herramientas de desarrollo. |

## 6.3 Suposiciones y dependencias

**Suposiciones:** la IE dispone de equipos con navegador e internet durante la sesión; el docente usa la
plataforma como complemento; las misiones son revisadas por un docente de química antes de publicarse;
los padres otorgan el consentimiento cuando corresponde.

**Dependencias:** disponibilidad de Neon, Render y GitHub (planes gratuitos con límites: suspensión de
Render tras 15 min sin tráfico; 100 CU-h/mes y 1 GB por proyecto en Neon); navegadores compatibles; la
API se despierta en hasta ~1 min tras inactividad (Render, s. f.).

## 6.4 Costos y precios

| Concepto | Costo (S/) |
|---|---|
| Costos generales (depreciación de laptop) | 316,67 |
| Costos operativos | 97,31 |
| Costos del ambiente (planes gratuitos) | 0,00 |
| Costos de personal (256 h × S/ 15) | 3 840,00 |
| **Total general del proyecto** | **4 253,98** |

Para la IE el uso es **gratuito**. Una operación en plan de pago se estima en S/ 786,60 por año (detalle y
análisis financiero en el FD01 v2.0).

## 6.5 Licenciamiento e instalación

Aplicación web de acceso por navegador; no requiere instalación en los equipos. El código se publica en
GitHub con licencia de código abierto (por definir: MIT propuesta). El despliegue es automático mediante
Terraform y GitHub Actions; las cuentas de docentes las crea el administrador y los estudiantes se unen
con el código del aula.

# 7. Características del producto

| Código | Característica | Descripción |
|---|---|---|
| CP-01 | Autenticación y roles | Registro e inicio de sesión con JWT; roles estudiante, docente y administrador. |
| CP-02 | Mapa de misiones | Tabla periódica interactiva; casillas bloqueadas, disponibles y completadas. |
| CP-03 | Niveles guiados | Objetivo, materiales y pasos con condición de éxito verificable. |
| CP-04 | Simulador molecular 2D | Temperatura, presión, volumen, luz UV; reacciones H₂ + O₂, Na + H₂O, Na + Cl₂, fotólisis. |
| CP-05 | Quimi | Pistas escalonadas con costo de XP; glosario con búsqueda de texto completo (PostgreSQL FTS). |
| CP-06 | Gamificación | XP, 1–3 estrellas, insignias, rachas y ranking por aula calculados en la BD. |
| CP-07 | Cuestionario de cierre | Preguntas por nivel con retroalimentación inmediata. |
| CP-08 | Aulas y asignaciones | Creación de aulas con código; asignación de misiones; panel de progreso. |
| CP-09 | Tablero de uso | Finalización, tiempo por paso, uso de pistas, aciertos del cuestionario. |
| CP-10 | Laboratorio libre | Simulador sin guía para exploración. |
| CP-11 | Integraciones | Extensión VS Code, skill de Claude Code, servidor MCP, GitHub Actions/Pages. |
| CP-12 | Modo demo offline | Frontend funcional sin API con catálogo local. |

# 8. Restricciones

| Código | Restricción |
|---|---|
| RES-01 | Plataforma web; sin instalación local. |
| RES-02 | Stack fijado: React + Vite + TS, Node 22 + Fastify + TS, PostgreSQL, Liquibase, Terraform, GitHub Actions. |
| RES-03 | Infraestructura en planes gratuitos (Neon, Render, GitHub Pages) durante desarrollo y piloto. |
| RES-04 | Desarrollo por una sola integrante en 16 semanas. |
| RES-05 | Simulación 2D; sin laboratorio 3D en esta versión. |
| RES-06 | Quimi basado en reglas; sin LLM en esta versión. |
| RES-07 | Las energías de activación del simulador son didácticas y se declaran como tales. |
| RES-08 | Datos de menores tratados conforme a la Ley 29733 y el D. S. 016-2024-JUS. |
| RES-09 | Las misiones deben ser validadas antes de publicarse. |
| RES-10 | El alcance se limita a lo definido en FD01–FD05. |

# 9. Rangos de calidad

| N.° | Requerimiento no funcional | Métrica verificable | Prioridad |
|---|---|---|---|
| RNF-01 | Usabilidad | SUS ≥ 70 (piloto) | Alta |
| RNF-02 | Accesibilidad | Lighthouse *Accessibility* ≥ 90; navegación por teclado; contraste WCAG 2.2 AA | Alta |
| RNF-03 | Rendimiento | Simulador ≥ 30 FPS en equipo de 4 GB; respuesta de API p95 < 500 ms con servicio activo | Alta |
| RNF-04 | Seguridad | JWT, *hash* de contraseñas, control por rol, HTTPS; sin hallazgos críticos de OWASP Top 10 | Alta |
| RNF-05 | Disponibilidad | ≥ 99 % en horario escolar; arranque en frío ≤ 60 s documentado | Alta |
| RNF-06 | Privacidad | Minimización de datos y consentimiento de padres para menores de 14 años | Alta |
| RNF-07 | Mantenibilidad | Cobertura de pruebas backend ≥ 70 %; TypeDoc publicado | Media |
| RNF-08 | Trazabilidad | 100 % de intentos, pasos, pistas y respuestas registrados con marca de tiempo | Alta |
| RNF-09 | Portabilidad | Terraform modular para migrar a Azure/AWS | Media |
| RNF-10 | Recuperabilidad | Respaldo automático diario de la BD con restauración probada | Media |

# 10. Precedencia y prioridad

| Código | Funcionalidad | Prioridad | Justificación |
|---|---|---|---|
| PR-01 | Modelo de BD y migraciones | Alta | Base de todo el sistema y eje del curso. |
| PR-02 | Autenticación y roles | Alta | Control de acceso y protección de menores. |
| PR-03 | Mapa de misiones y niveles guiados | Alta | Función principal ante el problema. |
| PR-04 | Simulador con verificación de pasos | Alta | Hace posible la práctica experimental. |
| PR-05 | Quimi (pistas + glosario) | Alta | Ayuda graduada durante la práctica. |
| PR-06 | Cuestionario de cierre | Alta | Mide el aprendizaje. |
| PR-07 | Aulas, asignaciones y panel docente | Alta | Seguimiento pedagógico. |
| PR-08 | Gamificación (XP, estrellas, insignias, rachas, ranking) | Media | Motivación; depende de PR-03 y PR-06. |
| PR-09 | Tablero de uso | Media | Medición de los objetivos SMART. |
| PR-10 | Automatizaciones (CI/CD, respaldos, costos, docs) | Media | Calidad y operación sin esfuerzo manual. |
| PR-11 | Integraciones (VS Code, Claude Code, MCP) | Baja | Valor agregado para desarrolladores. |
| PR-12 | Laboratorio libre | Baja | Exploración complementaria. |

# 11. Otros requerimientos del producto

## 11.1 Estándares legales

- **Ley N.° 29733**, Ley de Protección de Datos Personales (Congreso de la República, 2011).
- **D. S. N.° 016-2024-JUS**, nuevo Reglamento de la Ley 29733 (publicado el 30 de noviembre de 2024):
  consentimiento de quienes ejercen la patria potestad para menores, salvo mayores de 14 años; políticas
  de privacidad en lenguaje sencillo (Ministerio de Justicia y Derechos Humanos, 2024).
- **D. Leg. N.° 822**, Ley sobre el Derecho de Autor (1996).
- Licencias de software de terceros (MIT, Apache 2.0, PostgreSQL License).

## 11.2 Estándares de comunicación

- Lenguaje claro y adecuado a estudiantes de 12 a 17 años; mensajes breves orientados a la solución.
- Quimi responde con texto corto y escalonado; nunca muestra la solución sin que el estudiante la pida.
- Terminología química consistente con el glosario de la BD.
- Ranking con alias para no exponer nombres completos.

## 11.3 Estándares de cumplimiento de la plataforma

- Navegadores modernos con soporte de Canvas 2D y ES2020.
- API REST documentada (OpenAPI) y documentación de código con TypeDoc en GitHub Pages.
- Migraciones solo mediante Liquibase; ningún cambio manual en producción.
- Workflows de GitHub Actions en verde aunque falten *secrets* (los pasos de despliegue se omiten).

## 11.4 Estándares de calidad y seguridad

| Código | Estándar |
|---|---|
| ECS-01 | Autenticación JWT con expiración y contraseñas con *hash* (bcrypt/argon2). |
| ECS-02 | Control de acceso por rol en cada endpoint. |
| ECS-03 | Consultas parametrizadas; validación de entradas con esquemas. |
| ECS-04 | HTTPS obligatorio; CORS restringido al dominio del frontend. |
| ECS-05 | *Secrets* solo en GitHub Secrets; nunca en el repositorio. |
| ECS-06 | Respaldos automáticos de la BD y prueba de restauración. |
| ECS-07 | Revisión contra OWASP Top 10. |
| ECS-08 | Pruebas unitarias, de integración y E2E en CI. |

# 12. Conclusiones

1. AtomReactChamber responde a un problema documentado: bajo logro en ciencia (47 % en nivel 2+ en PISA
   2022; 21,8 % en zona rural) y pocas oportunidades de experimentación química guiada.
2. La solución combina práctica guiada verificada por simulador, ayuda graduada (Quimi), gamificación y
   seguimiento docente, enfoque respaldado por la evidencia sobre simulaciones y gamificación.
3. El alcance es realista para una desarrolladora en 16 semanas en el curso Base de Datos II: lo no
   esencial (3D, PDF por correo, números cuánticos, editor de prácticas, LLM) queda como trabajo futuro.
4. Los objetivos son SMART y se miden desde la propia base de datos, lo que permite verificar el éxito del piloto.

# 13. Recomendaciones

1. Mantener la coherencia entre FD01–FD05 (nombre, equipo, alcance, costos y objetivos).
2. Validar cada misión con un docente de química antes de publicarla.
3. Realizar el piloto con al menos un aula (n ≥ 30) y aplicar pre/post test y SUS.
4. Obtener el consentimiento de los padres antes del piloto con estudiantes menores de 14 años.
5. Calcular con datos del Censo Educativo el porcentaje de IE con laboratorio de ciencias (OI-1).
6. Evaluar la incorporación de un LLM para Quimi en la 3.ª unidad, con controles de seguridad para menores.

# 14. Bibliografía

Bangor, A., Kortum, P., & Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. *Journal of Usability Studies, 4*(3), 114–123. https://uxpajournal.org/wp-content/uploads/sites/7/pdf/JUS_Bangor_May2009.pdf

Congreso de la República del Perú. (2011). *Ley N.° 29733, Ley de Protección de Datos Personales*. https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales/243470-29733

Ministerio de Educación. (2016). *Currículo Nacional de la Educación Básica*. https://repositorio.minedu.gob.pe/handle/20.500.12799/4551

Ministerio de Justicia y Derechos Humanos. (2024). *Decreto Supremo N.° 016-2024-JUS que aprueba el Reglamento de la Ley N.° 29733*. https://www.congreso.gob.pe/Docs/DGP/DIDP/files/ds_016-2024-jus.pdf

OECD. (2023). *PISA 2022 results (Volume I and II) – Country notes: Peru*. https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/peru_3e71791c-en.html

Presidencia del Consejo de Ministros. (1996). *Decreto Legislativo N.° 822, Ley sobre el Derecho de Autor*. https://www.gob.pe/institucion/indecopi/normas-legales/1670023-822

Rutten, N., van Joolingen, W. R., & van der Veen, J. T. (2012). The learning effects of computer simulations in science education. *Computers & Education, 58*(1), 136–153. https://learntechlib.org/p/50686

Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*, 77–112. https://link.springer.com/article/10.1007/s10648-019-09498-w

Zeng, J., Sun, D., Looi, C.-K., & Fan, A. C. W. (2024). Exploring the impact of gamification on students' academic performance: A comprehensive meta-analysis of studies from the year 2008 to 2023. *British Journal of Educational Technology, 55*(6), 2478–2502. https://doi.org/10.1111/bjet.13471

# 15. Webgrafía

Andina. (2020). *Tacna, Moquegua y Arequipa lideran la mejora de aprendizajes a escala nacional*. https://andina.pe/ingles/noticia-tacna-moquegua-y-arequipa-lideran-mejora-aprendizajes-a-escala-nacional-800056.aspx

Gestión. (s. f.). [Nota sobre resultados de PISA 2022 con datos de la Defensoría del Pueblo; título y fecha por confirmar]. https://gestion.pe/peru/lea-tambien-modifican-reglamento-de-la-ley-de-reforma-magisterial-cuales-son-los-cambios-educacion-ocde-noticia/

Labster. (s. f.). *Precios*. Recuperado el 7 de noviembre de 2026, de https://www.labster.com/es/precios

Ministerio de Justicia y Derechos Humanos. (2024). *Ejecutivo aprueba nuevo reglamento de la Ley de Protección de Datos Personales*. https://www.gob.pe/institucion/minjus/noticias/1067368-ejecutivo-aprueba-nuevo-reglamento-de-la-ley-de-proteccion-de-datos-personales

Neon. (2026). *Free plan limits and quotas*. https://neon.com/faqs/free-plan-limits-and-quotas

OWASP Foundation. (2025). *OWASP Top Ten web application security risks*. https://owasp.org/www-project-top-ten/

Render. (s. f.). *Deploy for free*. https://render.com/docs/free

University of Colorado Boulder. (s. f.). *PhET Interactive Simulations*. https://phet.colorado.edu/es/
