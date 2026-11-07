# Direcciones de arte — AtomReactChamber v2

**Brief.** Laboratorio virtual de química **para escolares de 12 a 17 años** (secundaria, Perú). Trabajo principal
de la interfaz: que un estudiante entienda qué hacer en cada paso y quiera seguir jugando. Debe distinguirse
de una plantilla genérica "hecha con IA" y de los simuladores existentes.

Se evaluaron tres direcciones (skill *frontend-design* + *ui-ux-pro-max*):

| | A · Cuaderno cuadriculado | **B · Tablero periódico (elegida)** | C · Instrumento de laboratorio |
|---|---|---|---|
| Idea | Hoja de cuaderno de laboratorio con anotaciones a mano y stickers | **La tabla periódica es el tablero de juego**; cada casilla es un nivel | Panel de osciloscopio oscuro con lecturas fosforescentes |
| Fortaleza | Cercano al aula | Identidad propia, nace del tema, convierte el progreso en algo visible | Se siente "científico" |
| Riesgo | Tipografía manuscrita poco legible; fondo crema = cliché de IA | Requiere un mapa bien resuelto en móvil | Fondo casi negro + un acento ácido = el cliché más común de IA; frío para 12 años |
| Decisión | Se toma solo la cuadrícula del papel | **Base** | Se toma solo el visor oscuro de la cámara |

## Dirección elegida: «Tablero periódico»

**Lo memorable (un solo lugar audaz):** el mapa de misiones con la silueta completa de la tabla periódica;
las casillas que son niveles se "encienden" con el color de su misión.
Todo lo demás es sobrio: papel cuadriculado frío, tinta azul y mucho aire.

### Color — paleta del **ensayo a la llama**
Los colores de las misiones salen de una práctica real de laboratorio escolar: el color que da cada metal al quemarse.
| Token | Hex | Origen | Uso |
|---|---|---|---|
| `--tinta` | `#13233A` | tinta de cuaderno | texto, bordes fuertes |
| `--papel` | `#F4F7FB` | hoja cuadriculada fría (no crema) | fondo |
| `--cuadricula` | `#DCE5F0` | líneas del papel | patrón de fondo |
| `--cobre` | `#0A7266` | llama del cobre (verde azulado) | misión *La materia y sus estados*, acción primaria |
| `--calcio` | `#B54309` | llama del calcio (naranja) | misión *Combustión* |
| `--litio` | `#C2255C` | llama del litio (carmín) | misión *Familias de la tabla* |
| `--potasio` | `#7048E8` | llama del potasio (lila) | misión *La luz también reacciona* |
| `--sodio` | `#F2B705` | llama del sodio (amarillo) | estrellas, XP, logros |

Modo oscuro: fondo «pizarra» `#0E1A2B` (azul tinta, no negro), superficies `#15253B`, texto `#E6EDF5`;
los colores de llama se aclaran un paso para mantener contraste AA.
La cámara de simulación es siempre un **visor oscuro** (como la ventana de un instrumento) en ambos modos,
para que los colores CPK de los átomos se lean igual.

### Tipografía
- **Unbounded** (titulares y números grandes): geométrica y ancha, recuerda a las fichas de un juego de mesa.
- **Atkinson Hyperlegible Next** (texto): diseñada por el Braille Institute para máxima legibilidad —
  decisión de accesibilidad para estudiantes con baja visión o dislexia.
- **Atkinson Hyperlegible Mono** (lecturas numéricas del simulador: K, atm, nm).
- Sin etiquetas en mayúsculas sostenidas, sin palabras resaltadas en color dentro de titulares.

### Movimiento
- Un único momento orquestado: la **celebración al terminar un nivel** (estrellas que se llenan una a una + XP que sube).
- Microinteracciones con propósito: la casilla se "presiona" como una ficha física; el paso completado se marca.
- `prefers-reduced-motion` desactiva animaciones no esenciales (GSAP `matchMedia`).

### Prohibido (anti-plantilla)
Gradientes morados decorativos, glassmorphism, emojis como íconos, grillas de tarjetas idénticas con la
misma sombra, hero centrado genérico, Inter por defecto, eyebrows en mayúsculas sobre cada título.

### Accesibilidad (WCAG 2.2 AA)
Contraste ≥ 4.5:1 en texto, foco visible de 3 px, objetivos táctiles ≥ 44 px, toda la cámara operable con
teclado (controles con `<input type="range">` etiquetados), estado del paso anunciado con `aria-live`,
el mapa es una cuadrícula de botones con nombre accesible («Nivel 4, Combustión del hidrógeno, 2 estrellas»).
