# AtomReactChamber v0.1

Cámara de simulación termodinámica y molecular: un prototipo web interactivo
(React + Tailwind CSS + Lucide + HTML5 Canvas) para visualizar la teoría
cinético-molecular y reacciones químicas bajo temperatura, presión, volumen y
radiación UV variables.

Todo el simulador vive en un único componente: [`src/AtomReactChamber.jsx`](src/AtomReactChamber.jsx).

## Uso

```bash
npm install
npm run dev           # servidor de desarrollo (http://localhost:5173)
npm run build         # build de producción en dist/
npm run build:single  # dist/index.html autocontenido (un solo archivo)
```

## Módulos

| Zona | Contenido |
|---|---|
| Barra superior | Estado (En ejecución / Pausado / Reacción en curso), Play, Pausa, Paso, Reset, velocidad 0.5x–5x |
| Inyector | H₂, O₂, Na, H₂O, Cl₂, C; cantidad personalizada; limpiar cámara; 4 presets |
| Panel izquierdo | Temperatura (0–3000 K), presión (0.1–100 atm, escala log), volumen (1–50 L), UV (0–1000 W/m², 100–400 nm), chispa de activación |
| Viewport | Canvas a 60 FPS: colisiones, reacciones, destellos exo/endotérmicos, fotólisis, HUD con T, nº de moléculas/átomos y fase predominante |
| Panel derecho | Ficha de especie/reacción (masa molar, ΔHf°, ΔH, Eₐ, CID de PubChem), perfil energético interactivo, composición con tendencias y consola de eventos |

Clic en una zona vacía de la cámara inyecta 5 partículas de la especie seleccionada;
clic sobre una partícula la inspecciona en el panel de telemetría.

## Modelo físico-químico

- **Cinética:** discos rígidos 2D con colisiones elásticas (rejilla espacial).
  Velocidades de Maxwell-Boltzmann con σ = K·√(T/M), por lo que v ∝ √T.
  Un termostato de Berendsen acopla las partículas a la temperatura de la cámara.
- **Reacciones:** en cada colisión, si la energía relativa supera Eₐ, la reacción
  ocurre con un factor estérico (multiplicado por √P como factor de frecuencia).
  ΔH se calcula a partir de entalpías de formación estándar; el calor liberado
  eleva la temperatura de la cámara, lo que permite igniciones en cadena.
- **Mecanismos incluidos:** combustión de H₂ (H₂ + O₂ → H₂O + O·, O· + H₂ → H₂O),
  Na + H₂O, Na + Cl₂, C + O₂, cadena H₂/Cl₂ y recombinaciones radicalarias.
- **Fotólisis:** si la energía del fotón (119 627 / λ[nm] kJ/mol) supera el
  enlace (O=O 498, H–H 436, Cl–Cl 243 kJ/mol).
- **Fases:** sólido/líquido/gas por especie según puntos de fusión y ebullición,
  con ebullición corregida por presión (Clausius-Clapeyron). Plasma a ≥ 2800 K
  o con UV de vacío intenso.

> Las energías de activación son **valores de modelo a escala pedagógica**,
> elegidos para que las reacciones sean observables en segundos; las entalpías
> sí corresponden a datos termodinámicos estándar.
