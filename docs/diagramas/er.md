# Diagrama entidad-relación

> Generado automáticamente por `scripts/docs/build-diagrams.mjs`. No editar a mano.

29 tablas del esquema `public` (leído de la base de datos migrada). El diccionario de datos completo está en [docs/database](../database/).

```mermaid
erDiagram
  auditoria {
    bigint id PK
    character tabla
    character operacion
    text registro_id
    character usuario_bd
    jsonb datos_antes
    jsonb datos_despues
    timestamp ocurrido_en
  }
  aula {
    integer id PK
    character codigo
    character nombre
    smallint grado
    character seccion
    bigint docente_id FK
    timestamp creado_en
  }
  aula_nivel {
    integer aula_id PK
    smallint nivel_id PK
    date fecha_limite
    timestamp asignado_en
  }
  elemento {
    character simbolo PK
    character nombre
    smallint numero_atomico
    character color_hex
    character brillo_hex
    numeric radio_px
  }
  especie {
    character codigo PK
    character formula
    character nombre
    numeric masa_molar
    numeric dhf_kj_mol
    numeric punto_fusion_k
    numeric punto_ebull_k
    numeric dhvap_kj_mol
    numeric p_triple_atm
    numeric t_triple_k
    numeric dhvap_triple
    integer pubchem_cid
    boolean es_radical
    boolean inyectable
    smallint orden
  }
  especie_atomo {
    character especie_codigo PK
    smallint posicion PK
    character simbolo FK
    numeric x
    numeric y
  }
  evento {
    bigint id PK
    uuid sesion_id FK
    bigint usuario_id FK
    character tipo
    smallint nivel_id FK
    jsonb datos
    timestamp creado_en
  }
  fotolisis {
    character especie_codigo PK
    numeric enlace_kj_mol
    numeric seccion_eficaz
    character etiqueta
    character producto_1 FK
    character producto_2 FK
  }
  glosario {
    smallint id PK
    character termino
    text definicion
    tsvector busqueda
  }
  insignia {
    character codigo PK
    character nombre
    text descripcion
    character icono
    character tipo
    integer umbral
  }
  intento {
    bigint id PK
    bigint usuario_id FK
    smallint nivel_id FK
    character estado
    timestamp iniciado_en
    timestamp finalizado_en
    smallint pasos_completados
    smallint pistas_usadas
    smallint xp_pistas
    smallint aciertos
    smallint estrellas
    integer xp_obtenido
  }
  intento_paso {
    bigint intento_id PK
    integer paso_id PK
    integer segundos
    timestamp completado_en
  }
  logro_usuario {
    bigint usuario_id PK
    character insignia_codigo PK
    timestamp obtenido_en
  }
  matricula {
    integer aula_id PK
    bigint estudiante_id PK
    timestamp unido_en
  }
  mision {
    smallint id PK
    character codigo
    character titulo
    text descripcion
    text competencia
    character color
    smallint orden
  }
  nivel {
    smallint id PK
    character codigo
    smallint mision_id FK
    smallint orden
    character titulo
    text resumen
    text objetivo
    smallint grado
    smallint xp_base
    smallint minutos_estim
    character casilla_simbolo
    smallint casilla_fila
    smallint casilla_columna
    text casilla_nota
    jsonb inicio
    ARRAY controles
    ARRAY especies
    smallint nivel_previo_id FK
  }
  opcion {
    integer id PK
    integer pregunta_id FK
    smallint orden
    text texto
    boolean es_correcta
  }
  paso {
    integer id PK
    smallint nivel_id FK
    smallint orden
    character titulo
    text instruccion
    text concepto
    jsonb condicion
  }
  pista {
    integer id PK
    integer paso_id FK
    smallint nivel_ayuda
    text texto
    smallint costo_xp
  }
  pista_usada {
    bigint intento_id PK
    integer pista_id PK
    timestamp usada_en
  }
  pregunta {
    integer id PK
    smallint nivel_id FK
    smallint orden
    text enunciado
    text explicacion
  }
  preset {
    character codigo PK
    character nombre
    character ecuacion
    character sobre_flecha
    character etiqueta
    text pista
    jsonb parametros
    jsonb pasos
    smallint orden
  }
  preset_carga {
    character preset_codigo PK
    character especie_codigo PK
    smallint cantidad
  }
  reaccion {
    character codigo PK
    character etiqueta
    numeric ea_kj_mol
    numeric factor_esterico
    character enlace
  }
  reaccion_participante {
    character reaccion_codigo PK
    character papel PK
    smallint posicion PK
    character especie_codigo FK
  }
  respuesta {
    bigint intento_id PK
    integer pregunta_id PK
    integer opcion_id FK
    boolean es_correcta
    timestamp respondida_en
  }
  rol {
    smallint id PK
    character codigo
    character nombre
  }
  sesion {
    uuid id PK
    bigint usuario_id FK
    character origen
    character dispositivo
    timestamp iniciada_en
    timestamp ultima_actividad
  }
  usuario {
    bigint id PK
    character email
    character nombre
    character password_hash
    smallint rol_id FK
    smallint grado
    integer xp
    smallint racha_actual
    smallint racha_maxima
    date ultimo_dia_activo
    boolean activo
    timestamp creado_en
    timestamp actualizado_en
  }
  usuario ||--o{ aula : "docente_id"
  aula ||--o{ aula_nivel : "aula_id"
  nivel ||--o{ aula_nivel : "nivel_id"
  especie ||--o{ especie_atomo : "especie_codigo"
  elemento ||--o{ especie_atomo : "simbolo"
  sesion ||--o{ evento : "sesion_id"
  usuario ||--o{ evento : "usuario_id"
  nivel ||--o{ evento : "nivel_id"
  especie ||--o{ fotolisis : "especie_codigo"
  especie ||--o{ fotolisis : "producto_1"
  especie ||--o{ fotolisis : "producto_2"
  usuario ||--o{ intento : "usuario_id"
  nivel ||--o{ intento : "nivel_id"
  intento ||--o{ intento_paso : "intento_id"
  paso ||--o{ intento_paso : "paso_id"
  usuario ||--o{ logro_usuario : "usuario_id"
  insignia ||--o{ logro_usuario : "insignia_codigo"
  aula ||--o{ matricula : "aula_id"
  usuario ||--o{ matricula : "estudiante_id"
  mision ||--o{ nivel : "mision_id"
  nivel ||--o{ nivel : "nivel_previo_id"
  pregunta ||--o{ opcion : "pregunta_id"
  nivel ||--o{ paso : "nivel_id"
  paso ||--o{ pista : "paso_id"
  intento ||--o{ pista_usada : "intento_id"
  pista ||--o{ pista_usada : "pista_id"
  nivel ||--o{ pregunta : "nivel_id"
  preset ||--o{ preset_carga : "preset_codigo"
  especie ||--o{ preset_carga : "especie_codigo"
  reaccion ||--o{ reaccion_participante : "reaccion_codigo"
  especie ||--o{ reaccion_participante : "especie_codigo"
  intento ||--o{ respuesta : "intento_id"
  pregunta ||--o{ respuesta : "pregunta_id"
  opcion ||--o{ respuesta : "opcion_id"
  usuario ||--o{ sesion : "usuario_id"
  rol ||--o{ usuario : "rol_id"
```
