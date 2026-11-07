# Problema y objetivos — AtomReactChamber v2

> **Proyecto:** AtomReactChamber · **Curso:** Base de Datos II · **Docente:** Ing. Patrick Cuadros Quiroga
> **Integrante:** Adriana Rafaela Laos González (2023077474) · **UPT – FAING – EPIS** · Tacna, 2026
> **Versión:** 1.0 (2026-11-07)

## Nota de verificación de fuentes (leer primero)

Regla del proyecto: **ninguna cifra sin fuente**. Cada dato lleva cita APA 7 y URL. Al preparar este
documento, el entorno de trabajo **bloqueó la apertura directa** de algunos dominios (por ejemplo
`oecd.org` y `escale.minedu.gob.pe`). Por eso, las cifras se contrastaron con los **fragmentos
indexados por el buscador** de la propia página oficial o del artículo revisado por pares
(consulta: 7 de noviembre de 2026). Antes de entregar, **Adriana debe abrir cada URL y confirmar la cifra**.

Estado de cada dato:

| Símbolo | Significado |
|---|---|
| ✔ | Confirmado en fragmento de la fuente primaria (oficial o revisada por pares) |
| ◐ | Confirmado solo en fuente secundaria (prensa que cita a la fuente oficial) o con dudas menores |
| ✖ | **No verificado**: no se usa como dato; queda como tarea de investigación |

---

## 1. Título final del proyecto

| # | Propuesta | Ventajas | Desventajas |
|---|---|---|---|
| A | **AtomReactChamber: laboratorio virtual gamificado de química para estudiantes de secundaria del Perú** | Conserva la marca, dice *qué* es (laboratorio virtual), *cómo* (gamificado), *para quién* (secundaria) y *dónde* (Perú). Corto. | No menciona el CNEB explícitamente. |
| B | AtomReactChamber: plataforma web de prácticas guiadas de química con simulación molecular 2D y asistente Quimi, alineada al CNEB | Muy descriptivo y técnico. | Largo para portada; enfatiza tecnología antes que el problema. |
| C | Química en juego: misiones de laboratorio virtual con AtomReactChamber para Ciencia y Tecnología (1.º–5.º de secundaria) | Atractivo para el público escolar. | Desplaza la marca a segundo plano; menos formal. |

**Recomendación: opción A.** Es consistente en todos los documentos (corrige el defecto 1 de v0.1:
"Atom React Chamber / Atomic Reactor Chamber / Simulador v2.3 / QUIMI-K") y cabe en una línea de portada.
Forma escrita única: **AtomReactChamber** (una palabra, camel case). El asistente se llama **Quimi**.

---

## 2. Problema

### 2.1 Contexto

1. **Bajo desempeño en ciencia.** En PISA 2022 el Perú obtuvo **408 puntos en Ciencia** (404 en 2018;
   diferencia no significativa) (Ministerio de Educación [Minedu], 2023) ✔, frente a un promedio OCDE de
   **485** ◐ (Expreso, 2023). Solo **47 %** de los estudiantes peruanos alcanzó el **nivel 2 o superior**
   en ciencias (promedio OCDE: 76 %) y apenas **1 %** llegó a los niveles 5–6 (OCDE: 7 %) (OECD, 2023) ✔;
   la misma cifra de 47 % la reporta el Minedu ante el Congreso (Minedu, s. f.) ✔.
2. **Brecha rural.** En el área rural, solo **21,8 %** de estudiantes alcanzó el nivel 2 o más en ciencias
   en PISA 2022 (78,2 % por debajo), según la Defensoría del Pueblo citada por Gestión (s. f.) ◐. Para
   Lectura, el Minedu reporta 55,7 % (urbano) vs. 21,0 % (rural) en nivel 2 o más (Minedu, s. f.) ✔, lo
   que muestra una brecha de más de 30 puntos porcentuales.
3. **Contexto regional (Tacna).** Tacna lideró por cuarto año consecutivo las evaluaciones nacionales de
   2019; aun así, en la ECE 2019 de 2.º de secundaria solo **18,6 %** de sus estudiantes alcanzó el nivel
   **satisfactorio en Ciencia y Tecnología** (Andina, 2020) ◐. Es decir, incluso en la región con mejores
   resultados, más de 8 de cada 10 estudiantes no llegan al nivel esperado.
4. **Conectividad suficiente para una solución web, pero no universal.** En 2022, **71 %** de las IE
   públicas de secundaria y **76 %** de las privadas tenían acceso a internet (Minedu, Unidad de
   Estadística Educativa, s. f. [Edudatos 45]) ◐. Esto justifica una aplicación web **ligera** y con
   **modo demo sin conexión** (el frontend funciona sin API).
5. **Currículo.** El área de Ciencia y Tecnología del CNEB incluye la competencia *"Indaga mediante
   métodos científicos para construir sus conocimientos"* (Minedu, 2016) ✔, que exige experimentar,
   no solo memorizar.

**Datos no verificados (no se usan como cifra):**

- ✖ **% de IE de secundaria con laboratorio de ciencias** (nacional, rural/urbano y Tacna). El Censo
  Educativo registra el ambiente "laboratorio de ciencias", pero no se encontró un porcentaje publicado.
  → Se convierte en el **objetivo de investigación OI-1** (cálculo propio desde las bases de ESCALE).
- ✖ **% nacional de nivel satisfactorio en Ciencia y Tecnología, ECE 2019 (2.º sec.).** Circula el valor
  9,7 %, pero solo apareció en una presentación no oficial con categorías ambiguas. Debe confirmarse en
  SICRECE (Minedu) antes de citarlo.
- ✖ Resultados de Ciencia y Tecnología de ENLA 2023–2025 para 2.º de secundaria (los fragmentos no
  permitieron asignar las cifras al área). Consultar los resúmenes ejecutivos de la UMC.

### 2.2 Evidencia sobre la solución propuesta

| Evidencia | Hallazgo | Estado |
|---|---|---|
| Rutten, van Joolingen y van der Veen (2012), revisión de estudios (cuasi)experimentales 2002–2012 | Evidencia robusta de que las simulaciones por computadora **mejoran la enseñanza tradicional**, especialmente en actividades de laboratorio; útiles como preparación para el laboratorio real. | ✔ |
| Smetana y Bell (2012), revisión de 61 artículos (K-12 y universidad) | Las simulaciones son efectivas para conocimiento de contenido y habilidades de proceso, **si hay guía docente**. | ◐ |
| Li y Liang (2024), metaanálisis (PLOS ONE), 46 estudios | Efecto agregado de laboratorios virtuales **g = 0,686** (IC 95 % 0,414–0,959) — en ingeniería, no en secundaria; no reemplazan del todo al laboratorio físico. | ✔ |
| Sailer y Homner (2020), metaanálisis de gamificación | Efecto en aprendizaje cognitivo **g = 0,49** (IC 95 % 0,30–0,69; k = 19; N = 1686), estable en estudios de alto rigor. | ✔ |
| Zeng, Sun, Looi y Fan (2024), metaanálisis 2008–2023 (BJET) | Efecto de la gamificación en el rendimiento académico **g = 0,782**. | ✔ |

**Lectura crítica:** la evidencia es favorable pero heterogénea; la gamificación funciona mejor cuando
refuerza objetivos de aprendizaje (no solo puntos) y las simulaciones requieren guía. Por eso
AtomReactChamber combina **práctica guiada por pasos**, **pistas escalonadas (Quimi)** y **seguimiento docente**.

### 2.3 Árbol de problemas

**Problema central:** los estudiantes de 1.º a 5.º de secundaria tienen **pocas oportunidades de
experimentar** con fenómenos químicos, lo que limita el desarrollo de la competencia de indagación del CNEB.

| Causas | Efectos |
|---|---|
| C1. Laboratorios inexistentes, incompletos o sin reactivos (magnitud nacional ✖ por cuantificar — OI-1). | E1. Enseñanza de la química predominantemente expositiva y memorística. |
| C2. Riesgo y costo de reactivos (p. ej., sodio metálico, cloro, hidrógeno) que impiden hacer ciertas prácticas en el aula. | E2. Bajo logro en ciencia: 47 % en nivel 2+ de PISA (OECD, 2023); 21,8 % en zona rural (Gestión, s. f.). |
| C3. Simuladores existentes en inglés, genéricos o con licencias costosas (p. ej., contratos anuales de Labster "desde US$ 5 000"; Labster, s. f.) y sin vínculo con el CNEB ni con el aula del docente. | E3. Desmotivación: el estudiante no ve ni manipula lo que estudia. |
| C4. El docente no tiene datos de avance por estudiante y paso. | E4. Retroalimentación tardía y evaluación solo conceptual. |

### 2.4 A quién afecta

| Actor | Cómo le afecta |
|---|---|
| Estudiantes de 1.º–5.º de secundaria (12–17 años), especialmente de IE públicas y rurales | Aprenden química sin experimentar; menor logro y motivación. |
| Docentes de Ciencia y Tecnología | No pueden ejecutar prácticas peligrosas o costosas; no cuentan con datos de avance. |
| Directivos de IE / UGEL | Necesitan alternativas de bajo costo que complementen (no reemplacen) el laboratorio. |
| Familias | Requieren que el uso de datos de sus hijos sea seguro (Ley 29733 y DS 016-2024-JUS). |

---

## 3. Objetivos

### 3.1 Objetivo general

Desarrollar e implementar, en un plazo de 16 semanas, **AtomReactChamber**, un laboratorio virtual
gamificado de química con base de datos PostgreSQL, que permita a estudiantes de 1.º a 5.º de secundaria
realizar prácticas guiadas y verificadas por un simulador molecular 2D, y a los docentes hacer
seguimiento del avance, logrando en un piloto una tasa de niveles completados ≥ 60 % y una usabilidad SUS ≥ 70.

### 3.2 Objetivos de investigación (SMART)

> "S1…S16" = semana del cronograma del proyecto. Las fechas reales se fijan con el docente.

| ID | Objetivo | Indicador | Línea base | Meta | Método / instrumento | Plazo |
|---|---|---|---|---|---|---|
| OI-1 | Cuantificar la brecha de acceso a laboratorios de ciencias en IE de secundaria (nacional, urbano/rural, Tacna). | % de locales con nivel secundaria que reportan "laboratorio de ciencias" | No publicada (✖) | Cifra calculada y reproducible para los 3 ámbitos | Script sobre bases del Censo Educativo 2024/2025 (ESCALE), variables del diccionario de datos del local educativo | S4 |
| OI-2 | Medir la ganancia de aprendizaje tras usar 3 misiones. | Ganancia normalizada de Hake ⟨g⟩ = (post − pre)/(100 − pre) en % de respuestas correctas | Pre-test del piloto (se mide en S12) | ⟨g⟩ ≥ 0,30 (ganancia "media") con n ≥ 30 estudiantes | Cuestionario pre/post en la propia BD (`intento_cuestionario.momento = 'pre'/'post'`) | S14 |
| OI-3 | Evaluar la usabilidad percibida. | Puntaje SUS promedio | Promedio de referencia SUS ≈ 68 (Bangor et al., 2009) | SUS ≥ 70 | Cuestionario SUS (10 ítems) al final del piloto, estudiantes y docentes por separado | S15 |
| OI-4 | Analizar si las pistas escalonadas ayudan a resolver sin dar la respuesta. | % de pasos completados usando como máximo la pista de nivel 2 (explicación) | Sin línea base (sistema nuevo) | ≥ 70 % de pasos completados sin llegar a "solución" | Consulta SQL sobre `uso_pista` y `intento_paso` | S15 |

### 3.3 Objetivos de la solución (SMART)

| ID | Objetivo | Indicador | Línea base | Meta | Método / instrumento | Plazo |
|---|---|---|---|---|---|---|
| OS-1 | Publicar un catálogo de misiones alineadas al CNEB. | N.º de niveles publicados y validados (pasos verificables por el simulador) | v0.1: 0 niveles guiados (solo 4 *presets*) | ≥ 12 niveles en ≥ 4 temas (estados y gases, combustión H₂, Na + H₂O / Na + Cl₂, fotólisis) | Vista SQL de catálogo + checklist de validación científica | S10 |
| OS-2 | Lograr que los estudiantes terminen las misiones que empiezan. | Tasa de niveles completados = completados / iniciados | Sin línea base (sistema nuevo) | ≥ 60 % en el piloto | Vista `v_metricas_nivel` (BD) | S14 |
| OS-3 | Mejorar el desempeño en el cuestionario de cierre. | % de respuestas correctas (1.er intento vs. último intento) | Se mide en el 1.er intento del piloto | +15 puntos porcentuales | Tabla de respuestas de cuestionario | S14 |
| OS-4 | Mantener pasos de duración adecuada para una sesión de clase. | Mediana de tiempo por paso | Sin línea base | ≤ 3 min por paso; 100 % de pasos con tiempo registrado | `intento_paso.inicio/fin` | S14 |
| OS-5 | Que Quimi oriente sin resolver por el estudiante. | % de pasos donde se pidió el nivel "solución" | Sin línea base | ≤ 30 % | `uso_pista` por nivel | S14 |
| OS-6 | Garantizar accesibilidad. | Puntaje Lighthouse *Accessibility* | v0.1 no medido | ≥ 90 en 5 vistas (mapa, nivel, Quimi, perfil, aula) | Lighthouse CI en GitHub Actions | S12 |
| OS-7 | Mantener el servicio disponible en horario escolar. | Disponibilidad mensual = chequeos OK / chequeos totales | Sin línea base | ≥ 99 % (07:00–18:00); arranque en frío documentado | Workflow programado que consulta `/health` | S16 |
| OS-8 | Asegurar la calidad del software. | Cobertura de pruebas del backend; estado de pipelines | v0.1: 0 pruebas, sin CI | ≥ 70 % de cobertura; 100 % de workflows en verde en `main` | Reporte de cobertura + GitHub Actions | S16 |
| OS-9 | Facilitar la gestión docente. | % de docentes que crean un aula y asignan una misión sin ayuda en ≤ 5 min | Sin línea base | 100 % de los docentes del piloto (n ≥ 2) | Prueba de tarea cronometrada | S15 |
| OS-10 | Operar sin costo durante desarrollo y piloto. | Costo mensual de infraestructura | v0.1 estimaba S/ 245 de ambiente | S/ 0 (Neon, Render y GitHub Pages en plan gratuito) | Reporte de costos del workflow de infraestructura | S16 |

---

## 4. Referencias (APA 7)

Andina. (2020). *Tacna, Moquegua y Arequipa lideran la mejora de aprendizajes a escala nacional*. https://andina.pe/ingles/noticia-tacna-moquegua-y-arequipa-lideran-mejora-aprendizajes-a-escala-nacional-800056.aspx

Bangor, A., Kortum, P., & Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. *Journal of Usability Studies, 4*(3), 114–123. https://uxpajournal.org/wp-content/uploads/sites/7/pdf/JUS_Bangor_May2009.pdf

Expreso. (2023). *PISA 2022 Perú: se requiere eficiencia en el gasto en educación*. https://www.expreso.com.pe/opinion/pisa-2022-peru-se-requiere-eficiencia-en-el-gasto-en-educacion/

Gestión. (s. f.). [Nota sobre resultados de PISA 2022 con datos de la Defensoría del Pueblo; título y fecha por confirmar al abrir la URL]. https://gestion.pe/peru/lea-tambien-modifican-reglamento-de-la-ley-de-reforma-magisterial-cuales-son-los-cambios-educacion-ocde-noticia/

Labster. (s. f.). *Precios*. Recuperado el 7 de noviembre de 2026, de https://www.labster.com/es/precios

Li, Y., & Liang, J. (2024). Effectiveness of virtual laboratory in engineering education: A meta-analysis. *PLOS ONE, 19*(12), e0316269. https://pmc.ncbi.nlm.nih.gov/articles/PMC11684589/

Ministerio de Educación. (2016). *Currículo Nacional de la Educación Básica* (R. M. N.° 281-2016-MINEDU). https://repositorio.minedu.gob.pe/handle/20.500.12799/4551

Ministerio de Educación. (2023). *Pisa 2022: el Perú mantiene sus resultados en las competencias de lectura y ciencia*. https://www.gob.pe/institucion/minedu/noticias/877904-pisa-2022-el-peru-mantiene-sus-resultados-en-las-competencias-de-lectura-y-ciencia

Ministerio de Educación. (s. f.). *Resultados de PISA 2022* [Presentación ante la Comisión Especial OCDE del Congreso]. https://www.congreso.gob.pe/Docs/comisiones2021/CESIP-OCDE/files/pisa_minedu.pdf

Ministerio de Educación, Unidad de Estadística Educativa. (s. f.). *Edudatos 45: Conectividad*. https://escale.minedu.gob.pe/documents/inicio/Analisis/Edudatos/Edudatos%2045%20-%20Conectividad.pdf

OECD. (2023). *PISA 2022 results (Volume I and II) – Country notes: Peru*. OECD Publishing. https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/peru_3e71791c-en.html

Rutten, N., van Joolingen, W. R., & van der Veen, J. T. (2012). The learning effects of computer simulations in science education. *Computers & Education, 58*(1), 136–153. https://learntechlib.org/p/50686

Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*, 77–112. https://link.springer.com/article/10.1007/s10648-019-09498-w

Smetana, L. K., & Bell, R. L. (2012). Computer simulations to support science instruction and learning: A critical review of the literature. *International Journal of Science Education, 34*(9), 1337–1370. [Resumen consultado en] https://eepro.naaee.org/research/eeresearch/computer-simulations-support-science-teaching

Suzuki Cósser, G. (2023). Impacto de la infraestructura escolar sobre el rendimiento académico de los alumnos del Perú: implementación de laboratorios en las instituciones educativas. En *Ensayos de investigación económica 2023*. Universidad del Pacífico. https://repositorio.up.edu.pe/backend/api/core/bitstreams/8bd533c0-4bfd-4fd9-bad9-25c2b72f1416/content

Zeng, J., Sun, D., Looi, C.-K., & Fan, A. C. W. (2024). Exploring the impact of gamification on students' academic performance: A comprehensive meta-analysis of studies from the year 2008 to 2023. *British Journal of Educational Technology, 55*(6), 2478–2502. https://doi.org/10.1111/bjet.13471
