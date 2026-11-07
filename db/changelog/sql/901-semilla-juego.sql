--liquibase formatted sql
-- ARCHIVO GENERADO por db/scripts/generate-seed.mjs — no editar a mano.

--changeset adriana.laos:901-1 runOnChange:true comment:Semilla de misiones
INSERT INTO mision (codigo, titulo, descripcion, competencia, color, orden) VALUES
  ('estados', 'La materia y sus estados', 'Partículas en movimiento, temperatura, cambios de estado y presión.', 'Explica el mundo físico basándose en conocimientos sobre los seres vivos, materia y energía, biodiversidad, Tierra y universo.', 'estados', 1),
  ('combustion', 'Reacciones de combustión', 'Reactivos, productos, energía de activación y energía liberada.', 'Indaga mediante métodos científicos para construir sus conocimientos.', 'combustion', 2),
  ('familias', 'Familias de la tabla periódica', 'Metales alcalinos y halógenos: por qué reaccionan con tanta energía.', 'Explica el mundo físico basándose en conocimientos sobre los seres vivos, materia y energía, biodiversidad, Tierra y universo.', 'familias', 3),
  ('luz', 'La luz también reacciona', 'Fotones, longitud de onda, radicales y reacciones en cadena.', 'Indaga mediante métodos científicos para construir sus conocimientos.', 'luz', 4)
ON CONFLICT (codigo) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion, competencia = EXCLUDED.competencia, color = EXCLUDED.color, orden = EXCLUDED.orden;
--rollback DELETE FROM mision;

--changeset adriana.laos:901-2 runOnChange:true comment:Semilla de niveles, pasos, pistas y cuestionarios
INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES ('n01-movimiento', (SELECT id FROM mision WHERE codigo = 'estados'), 1, 'Moléculas en movimiento', 'Descubre qué tiene que ver la temperatura con la rapidez de las partículas.', 'Relacionar la temperatura con la energía de movimiento (energía cinética) de las partículas.', 1, 100, 8,
  'H', 1, 1, 'Empiezas en el hidrógeno: el elemento más simple y el primero de la tabla.', '{"parametros":{"T":150,"P":1,"V":25,"UV":0,"lambda":254},"carga":{"H2":30}}'::jsonb, ARRAY['T', 'inyectar']::text[], ARRAY['H2']::text[])
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n01-movimiento'), 1, 'Agrega más moléculas', 'Inyecta hidrógeno (H₂) hasta tener al menos 50 moléculas en la cámara.', 'Una molécula es un grupo de átomos unidos. El H₂ son dos átomos de hidrógeno unidos por un enlace.', '{"todas":[{"metrica":"conteo:H2","op":">=","valor":50}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pa.orden = 1), 1, 'Elige H₂ en el inyector y pulsa «Inyectar».', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pa.orden = 1), 2, 'Cada clic en una zona vacía de la cámara también agrega 5 moléculas.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pa.orden = 1), 3, 'Selecciona H₂, escribe 20 en cantidad y pulsa «Inyectar».', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n01-movimiento'), 2, 'Calienta la cámara', 'Sube la temperatura hasta 600 K o más y mira cómo cambia el movimiento.', 'La temperatura mide qué tan rápido se mueven, en promedio, las partículas. Más temperatura = más energía cinética.', '{"todas":[{"metrica":"temperatura","op":">=","valor":600}],"durante":2}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pa.orden = 2), 1, 'Busca el control con el termómetro.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pa.orden = 2), 2, 'La temperatura de la cámara tarda unos segundos en alcanzar la que eliges.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pa.orden = 2), 3, 'Mueve el control de temperatura a 650 K y espera 3 segundos.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n01-movimiento'), 3, 'Congela el hidrógeno', 'Enfría la cámara hasta que el hidrógeno se vuelva sólido.', 'Al quitar energía, las partículas se frenan tanto que quedan casi quietas y ordenadas: eso es un sólido.', '{"todas":[{"metrica":"fase:H2","op":"==","valor":"Sólido"}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pa.orden = 3), 1, 'El hidrógeno se congela a una temperatura muy, muy baja.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pa.orden = 3), 2, 'El punto de fusión del H₂ es 14 K (−259 °C).', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pa.orden = 3), 3, 'Lleva la temperatura a 5 K.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n01-movimiento'), 1, 'Si aumentas la temperatura de un gas, sus partículas…', 'La temperatura es una medida de la energía cinética promedio: a más temperatura, más rapidez.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 1);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 1), 1, 'se mueven más rápido', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 1), 2, 'se mueven más lento', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 1), 3, 'se vuelven más grandes', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 1), 4, 'dejan de chocar', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n01-movimiento'), 2, '¿En qué estado las partículas están más ordenadas y casi quietas?', 'En el sólido las partículas solo vibran en su lugar.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 2);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 2), 1, 'Gas', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 2), 2, 'Líquido', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 2), 3, 'Sólido', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n01-movimiento'), 3, '0 K (cero absoluto) equivale aproximadamente a…', 'K = °C + 273, por lo tanto 0 K ≈ −273 °C.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 3);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 3), 1, '0 °C', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 3), 2, '−273 °C', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 3), 3, '100 °C', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n01-movimiento' AND pr.orden = 3), 4, '−100 °C', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES ('n02-agua', (SELECT id FROM mision WHERE codigo = 'estados'), 2, 'El agua cambia de estado', 'Derrite hielo, haz hervir el agua y vuelve a condensarla.', 'Identificar la fusión, la ebullición y la condensación y sus temperaturas a 1 atm.', 1, 120, 10,
  'He', 1, 18, 'El helio solo se vuelve líquido a −269 °C; aquí estudiarás los cambios de estado con algo más cercano: el agua.', '{"parametros":{"T":250,"P":1,"V":20,"UV":0,"lambda":254},"carga":{"H2O":60}}'::jsonb, ARRAY['T']::text[], ARRAY['H2O']::text[])
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n02-agua'), 1, 'Derrite el hielo', 'El agua está congelada. Calienta la cámara hasta que el agua sea líquida.', 'La fusión es el paso de sólido a líquido. El hielo se funde a 0 °C, que son 273 K.', '{"todas":[{"metrica":"fase:H2O","op":"==","valor":"Líquido"}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n02-agua' AND pa.orden = 1), 1, 'Necesitas superar el punto de fusión del agua.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n02-agua' AND pa.orden = 1), 2, '0 °C = 273 K. Sube un poco más que eso.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n02-agua' AND pa.orden = 1), 3, 'Lleva la temperatura a 300 K.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n02-agua'), 2, 'Haz hervir el agua', 'Sigue calentando hasta que el agua se convierta en gas (vapor).', 'La ebullición es el paso de líquido a gas. A nivel del mar (1 atm) el agua hierve a 100 °C = 373 K.', '{"todas":[{"metrica":"fase:H2O","op":"==","valor":"Gas"}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n02-agua' AND pa.orden = 2), 1, 'El agua hierve a 100 °C.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n02-agua' AND pa.orden = 2), 2, 'Convierte: 100 + 273 = 373 K.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n02-agua' AND pa.orden = 2), 3, 'Lleva la temperatura a 400 K.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n02-agua'), 3, 'Condensa el vapor', 'Enfría lo justo para que el vapor vuelva a ser agua líquida, sin congelarla.', 'La condensación es el paso de gas a líquido; ocurre al quitar energía, como el vapor que se vuelve gotas en la tapa de una olla.', '{"todas":[{"metrica":"fase:H2O","op":"==","valor":"Líquido"},{"metrica":"temperatura","op":">=","valor":274}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n02-agua' AND pa.orden = 3), 1, 'Necesitas quedar entre el punto de fusión y el de ebullición.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n02-agua' AND pa.orden = 3), 2, 'Entre 273 K y 373 K el agua es líquida a 1 atm.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n02-agua' AND pa.orden = 3), 3, 'Lleva la temperatura a 320 K.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n02-agua'), 1, '¿Cómo se llama el paso de gas a líquido?', 'Condensación: el vapor pierde energía y sus partículas se juntan.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 1);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 1), 1, 'Evaporación', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 1), 2, 'Condensación', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 1), 3, 'Fusión', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 1), 4, 'Sublimación', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n02-agua'), 2, '¿A cuántos kelvin hierve el agua a 1 atm?', '100 °C + 273 = 373 K.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 2);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 2), 1, '100 K', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 2), 2, '273 K', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 2), 3, '373 K', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 2), 4, '473 K', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n02-agua'), 3, 'Durante la fusión, el hielo…', 'Al fundirse, el agua absorbe energía del entorno.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 3);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 3), 1, 'absorbe energía', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 3), 2, 'libera energía', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n02-agua' AND pr.orden = 3), 3, 'no intercambia energía', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES ('n03-presion', (SELECT id FROM mision WHERE codigo = 'estados'), 3, 'La presión cambia el punto de ebullición', 'Entiende la olla a presión y por qué en Puno el agua hierve antes que en Tacna.', 'Explicar cómo la presión modifica la temperatura de ebullición de un líquido.', 2, 150, 12,
  'N', 2, 15, 'El aire que nos presiona es casi 80 % nitrógeno: su peso es la presión atmosférica.', '{"parametros":{"T":380,"P":1,"V":20,"UV":0,"lambda":254},"carga":{"H2O":60}}'::jsonb, ARRAY['T', 'P']::text[], ARRAY['H2O']::text[])
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n03-presion'), 1, 'Olla a presión', 'A 380 K el agua es vapor. Sin bajar la temperatura, aumenta la presión hasta que el agua vuelva a ser líquida.', 'Con más presión, las partículas necesitan más energía para escapar del líquido: el punto de ebullición sube.', '{"todas":[{"metrica":"presion","op":">=","valor":1.5},{"metrica":"fase:H2O","op":"==","valor":"Líquido"}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n03-presion' AND pa.orden = 1), 1, 'Usa el control de presión, no el de temperatura.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n03-presion' AND pa.orden = 1), 2, 'Con 2 atm el agua hierve cerca de 394 K, más que los 380 K actuales.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n03-presion' AND pa.orden = 1), 3, 'Lleva la presión a 2 atm.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n03-presion'), 2, 'Hierve a alta presión', 'Manteniendo la presión alta, calienta hasta que el agua vuelva a hervir.', 'Una olla a presión cocina más rápido porque el agua hierve a más de 100 °C.', '{"todas":[{"metrica":"presion","op":">=","valor":1.5},{"metrica":"fase:H2O","op":"==","valor":"Gas"}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n03-presion' AND pa.orden = 2), 1, 'Necesitas superar el nuevo punto de ebullición.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n03-presion' AND pa.orden = 2), 2, 'A 2 atm, el agua hierve a unos 394 K.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n03-presion' AND pa.orden = 2), 3, 'Lleva la temperatura a 410 K sin tocar la presión.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n03-presion'), 3, 'Sube a la montaña', 'Simula estar en una ciudad alta: baja la presión a 0.6 atm o menos y logra que el agua hierva por debajo de 365 K.', 'En Puno (≈3800 m) la presión del aire es menor que en Tacna, así que el agua hierve a menos de 100 °C.', '{"todas":[{"metrica":"presion","op":"<=","valor":0.6},{"metrica":"temperatura","op":"<=","valor":365},{"metrica":"fase:H2O","op":"==","valor":"Gas"}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n03-presion' AND pa.orden = 3), 1, 'Primero baja la presión, luego la temperatura.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n03-presion' AND pa.orden = 3), 2, 'A 0.5 atm el agua hierve cerca de 355 K.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n03-presion' AND pa.orden = 3), 3, 'Presión 0.5 atm y temperatura 360 K.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n03-presion'), 1, 'Si aumenta la presión sobre un líquido, su punto de ebullición…', 'Más presión exige más energía para que las partículas escapen: el punto de ebullición sube.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 1);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 1), 1, 'sube', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 1), 2, 'baja', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 1), 3, 'no cambia', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n03-presion'), 2, '¿Por qué en Puno el agua hierve a menos de 100 °C?', 'A mayor altitud hay menos aire encima, la presión atmosférica es menor.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 2);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 2), 1, 'Porque hace más frío', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 2), 2, 'Porque la presión atmosférica es menor', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 2), 3, 'Porque el agua es diferente', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n03-presion'), 3, 'Una olla a presión cocina más rápido porque…', 'El agua alcanza más de 100 °C antes de hervir.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 3);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 3), 1, 'el agua hierve a mayor temperatura', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 3), 2, 'el agua hierve a menor temperatura', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n03-presion' AND pr.orden = 3), 3, 'usa menos agua', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES ('n04-hidrogeno', (SELECT id FROM mision WHERE codigo = 'combustion'), 4, 'Combustión del hidrógeno', 'Prepara la mezcla correcta, dale energía de activación y produce agua.', 'Reconocer reactivos, productos, proporciones y energía de activación en una combustión.', 3, 180, 12,
  'O', 2, 16, 'Toda combustión necesita oxígeno: es el comburente.', '{"parametros":{"T":300,"P":1,"V":12,"UV":0,"lambda":254},"carga":{}}'::jsonb, ARRAY['T', 'inyectar', 'chispa']::text[], ARRAY['H2', 'O2']::text[])
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n04-hidrogeno'), 1, 'Prepara la mezcla', 'Inyecta hidrógeno y oxígeno en proporción 2 a 1 (al menos 40 H₂ y 20 O₂).', 'La ecuación 2H₂ + O₂ → 2H₂O dice que por cada molécula de O₂ se necesitan dos de H₂.', '{"todas":[{"metrica":"conteo:H2","op":">=","valor":40},{"metrica":"conteo:O2","op":">=","valor":20},{"metrica":"razon:H2:O2","op":"approx","valor":2,"tol":0.35}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 1), 1, 'Mira los coeficientes de la ecuación.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 1), 2, 'Por cada O₂ debes tener dos H₂.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 1), 3, 'Inyecta 40 de H₂ y 20 de O₂.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n04-hidrogeno'), 2, 'Calienta la mezcla', 'Lleva la cámara a 700 K. ¿Reacciona sola?', 'Calentar da energía, pero muchas mezclas son estables hasta que alguna colisión supera la energía de activación.', '{"todas":[{"metrica":"temperatura","op":">=","valor":680}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 2), 1, 'Usa el termómetro.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 2), 2, 'Espera a que la cámara llegue cerca de la temperatura elegida.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 2), 3, 'Temperatura 700 K.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n04-hidrogeno'), 3, 'Da la chispa', 'Usa la chispa para iniciar la reacción.', 'La energía de activación (Eₐ) es la energía mínima que necesita un choque para romper enlaces y formar otros nuevos.', '{"todas":[{"metrica":"chispas","op":">=","valor":1},{"metrica":"reacciones:h2o2","op":">=","valor":1}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 3), 1, 'Busca el botón con el rayo.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 3), 2, 'La chispa calienta un punto de la cámara a unos 5000 K.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 3), 3, 'Pulsa «Chispa» una o dos veces.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n04-hidrogeno'), 4, 'Produce agua', 'Deja que la reacción continúe hasta tener 15 moléculas de agua o más.', 'Esta reacción es exotérmica: libera energía (ΔH < 0) y por eso la temperatura sube sola.', '{"todas":[{"metrica":"conteo:H2O","op":">=","valor":15}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 4), 1, 'Observa el panel de composición.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 4), 2, 'Si se detiene, da otra chispa.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pa.orden = 4), 3, 'Pulsa «Chispa» y espera unos segundos.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n04-hidrogeno'), 1, 'En 2H₂ + O₂ → 2H₂O, ¿cuáles son los reactivos?', 'Los reactivos están a la izquierda de la flecha.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 1);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 1), 1, 'H₂ y O₂', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 1), 2, 'H₂O', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 1), 3, 'Solo O₂', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n04-hidrogeno'), 2, '¿Para qué sirve la chispa?', 'Aporta la energía de activación para que comience la reacción.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 2);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 2), 1, 'Para aportar la energía de activación', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 2), 2, 'Para enfriar la mezcla', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 2), 3, 'Para agregar oxígeno', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n04-hidrogeno'), 3, 'Una reacción exotérmica…', 'Exotérmica: libera energía al entorno (ΔH negativo).')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 3);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 3), 1, 'libera energía', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 3), 2, 'absorbe energía', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n04-hidrogeno' AND pr.orden = 3), 3, 'no usa energía', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES ('n05-carbono', (SELECT id FROM mision WHERE codigo = 'combustion'), 5, 'Combustión del carbono', 'Quema carbono y forma dióxido de carbono, el gas que exhalamos.', 'Aplicar la conservación de los átomos en la combustión del carbono.', 3, 180, 10,
  'C', 2, 14, 'El carbono es la base del carbón, la leña y los combustibles.', '{"parametros":{"T":300,"P":1,"V":14,"UV":0,"lambda":254},"carga":{"C":30,"O2":40}}'::jsonb, ARRAY['T', 'chispa', 'inyectar']::text[], ARRAY['C', 'O2']::text[])
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n05-carbono'), 1, 'Calienta el carbono', 'Lleva la cámara a 1200 K o más.', 'El carbón necesita mucha temperatura para empezar a arder.', '{"todas":[{"metrica":"temperatura","op":">=","valor":1150}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n05-carbono' AND pa.orden = 1), 1, 'Sube bastante la temperatura.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n05-carbono' AND pa.orden = 1), 2, 'Más de 1000 K.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n05-carbono' AND pa.orden = 1), 3, 'Temperatura 1250 K.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n05-carbono'), 2, 'Inicia la combustión', 'Consigue que se formen 5 moléculas de CO₂.', 'C + O₂ → CO₂: un átomo de carbono se une a dos de oxígeno.', '{"todas":[{"metrica":"reacciones:co2","op":">=","valor":5}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n05-carbono' AND pa.orden = 2), 1, 'La chispa ayuda a superar la energía de activación.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n05-carbono' AND pa.orden = 2), 2, 'La Eₐ de esta reacción es alta (38 kJ/mol en el modelo).', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n05-carbono' AND pa.orden = 2), 3, 'Pulsa «Chispa» varias veces.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n05-carbono'), 3, 'Cuenta los átomos', 'Sigue hasta tener 12 moléculas de CO₂.', 'En una reacción los átomos no se crean ni se destruyen: solo se reorganizan (ley de conservación de la masa).', '{"todas":[{"metrica":"conteo:CO2","op":">=","valor":12}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n05-carbono' AND pa.orden = 3), 1, 'Si se agota el O₂, inyecta más.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n05-carbono' AND pa.orden = 3), 2, 'Cada CO₂ usa un C y un O₂.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n05-carbono' AND pa.orden = 3), 3, 'Inyecta 10 O₂ y pulsa «Chispa».', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n05-carbono'), 1, '¿Cuántos átomos de oxígeno tiene una molécula de CO₂?', 'El subíndice 2 indica dos átomos de oxígeno.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 1);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 1), 1, '1', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 1), 2, '2', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 1), 3, '3', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n05-carbono'), 2, 'En una reacción química, los átomos…', 'Ley de conservación de la masa (Lavoisier).')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 2);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 2), 1, 'se reorganizan, no se pierden', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 2), 2, 'desaparecen', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 2), 3, 'se crean nuevos', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n05-carbono'), 3, 'El CO₂ es un gas que…', 'El CO₂ es un gas de efecto invernadero producido en las combustiones.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 3);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 3), 1, 'contribuye al efecto invernadero', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 3), 2, 'es un metal', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n05-carbono' AND pr.orden = 3), 3, 'es un sólido a temperatura ambiente', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES ('n06-sodio', (SELECT id FROM mision WHERE codigo = 'familias'), 6, 'Metal alcalino y agua', 'Observa por qué el sodio reacciona violentamente con el agua.', 'Explicar la reactividad de los metales alcalinos (grupo 1) a partir de su reacción con el agua.', 4, 200, 12,
  'Na', 3, 1, 'El sodio pertenece al grupo 1: los metales alcalinos, los más reactivos de los metales.', '{"parametros":{"T":300,"P":1,"V":10,"UV":0,"lambda":254},"carga":{}}'::jsonb, ARRAY['T', 'P', 'inyectar']::text[], ARRAY['Na', 'H2O']::text[])
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n06-sodio'), 1, 'Prepara los reactivos', 'Inyecta al menos 20 átomos de sodio y 30 moléculas de agua.', 'Nunca hagas esto en casa: el sodio real arde al tocar el agua. En el simulador es seguro.', '{"todas":[{"metrica":"conteo:Na","op":">=","valor":20},{"metrica":"conteo:H2O","op":">=","valor":30}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n06-sodio' AND pa.orden = 1), 1, 'Usa el inyector dos veces.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n06-sodio' AND pa.orden = 1), 2, 'Elige Na y luego H₂O.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n06-sodio' AND pa.orden = 1), 3, '20 de Na y 30 de H₂O.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n06-sodio'), 2, 'Agua densa y caliente', 'Sube la temperatura a 700 K o más y la presión a 50 atm o más.', 'A más presión, más choques por segundo; a más temperatura, choques más fuertes.', '{"todas":[{"metrica":"temperatura","op":">=","valor":700},{"metrica":"presion","op":">=","valor":50}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n06-sodio' AND pa.orden = 2), 1, 'Necesitas ajustar dos controles.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n06-sodio' AND pa.orden = 2), 2, 'Temperatura y presión altas.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n06-sodio' AND pa.orden = 2), 3, '760 K y 100 atm.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n06-sodio'), 3, 'Libera hidrógeno', 'Logra que se formen 10 unidades de hidróxido de sodio (NaOH).', '2Na + 2H₂O → 2NaOH + H₂. El sodio cede su único electrón externo con mucha facilidad.', '{"todas":[{"metrica":"conteo:NaOH","op":">=","valor":10}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n06-sodio' AND pa.orden = 3), 1, 'Espera y observa los destellos.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n06-sodio' AND pa.orden = 3), 2, 'Si va lento, sube más la presión.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n06-sodio' AND pa.orden = 3), 3, 'Presión 100 atm y espera 10 segundos.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n06-sodio'), 1, 'El sodio pertenece al grupo de…', 'Grupo 1: metales alcalinos.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 1);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 1), 1, 'los metales alcalinos', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 1), 2, 'los halógenos', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 1), 3, 'los gases nobles', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n06-sodio'), 2, '¿Qué gas se libera cuando el sodio reacciona con agua?', 'Se libera hidrógeno (H₂).')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 2);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 2), 1, 'Oxígeno', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 2), 2, 'Hidrógeno', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 2), 3, 'Cloro', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n06-sodio'), 3, '¿Por qué los metales alcalinos son tan reactivos?', 'Tienen un solo electrón en su capa externa y lo ceden fácilmente.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 3);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 3), 1, 'Porque ceden con facilidad su único electrón externo', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 3), 2, 'Porque son muy pesados', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n06-sodio' AND pr.orden = 3), 3, 'Porque son gases', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES ('n07-sal', (SELECT id FROM mision WHERE codigo = 'familias'), 7, 'Formación de la sal de mesa', 'Un metal peligroso y un gas tóxico forman algo que comes todos los días.', 'Comprender que un compuesto tiene propiedades distintas a las de sus elementos.', 4, 200, 10,
  'Cl', 3, 17, 'El cloro es un halógeno (grupo 17): le falta un electrón para estar completo.', '{"parametros":{"T":300,"P":1,"V":12,"UV":0,"lambda":254},"carga":{}}'::jsonb, ARRAY['T', 'inyectar']::text[], ARRAY['Na', 'Cl2']::text[])
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n07-sal'), 1, 'Junta sodio y cloro', 'Inyecta al menos 20 Na y 10 Cl₂.', 'El sodio (grupo 1) quiere ceder un electrón; el cloro (grupo 17) quiere ganarlo.', '{"todas":[{"metrica":"conteo:Na","op":">=","valor":20},{"metrica":"conteo:Cl2","op":">=","valor":10}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n07-sal' AND pa.orden = 1), 1, 'Usa el inyector con cada especie.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n07-sal' AND pa.orden = 1), 2, 'Na primero, Cl₂ después.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n07-sal' AND pa.orden = 1), 3, '20 de Na y 12 de Cl₂.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n07-sal'), 2, 'Funde el sodio', 'Calienta por encima de 450 K para que el sodio se funda y se mueva.', 'El sodio se funde a 371 K (98 °C). Fundido, sus átomos chocan con más libertad.', '{"todas":[{"metrica":"temperatura","op":">=","valor":450}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n07-sal' AND pa.orden = 2), 1, 'Sube la temperatura.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n07-sal' AND pa.orden = 2), 2, 'Más de 371 K.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n07-sal' AND pa.orden = 2), 3, 'Temperatura 500 K.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n07-sal'), 3, 'Forma sal', 'Consigue 15 unidades de cloruro de sodio (NaCl).', 'Na + Cl → NaCl: se forma un enlace iónico entre Na⁺ y Cl⁻.', '{"todas":[{"metrica":"conteo:NaCl","op":">=","valor":15}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n07-sal' AND pa.orden = 3), 1, 'Espera y mira el panel de composición.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n07-sal' AND pa.orden = 3), 2, 'Si se acaba el cloro, inyecta más.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n07-sal' AND pa.orden = 3), 3, 'Inyecta 10 Cl₂ más.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n07-sal'), 1, 'El NaCl se forma mediante un enlace…', 'Iónico: el Na cede un electrón al Cl.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 1);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 1), 1, 'iónico', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 1), 2, 'metálico', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 1), 3, 'no hay enlace', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n07-sal'), 2, 'Las propiedades de la sal frente a las del sodio y el cloro son…', 'Un compuesto tiene propiedades propias, distintas de sus elementos.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 2);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 2), 1, 'distintas', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 2), 2, 'iguales', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 2), 3, 'la suma de ambas', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n07-sal'), 3, 'El cloro pertenece al grupo de…', 'Grupo 17: halógenos.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 3);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 3), 1, 'los halógenos', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 3), 2, 'los metales alcalinos', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n07-sal' AND pr.orden = 3), 3, 'los metales de transición', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES ('n08-fotolisis', (SELECT id FROM mision WHERE codigo = 'luz'), 8, 'Luz que rompe enlaces', 'Usa luz ultravioleta para romper moléculas de oxígeno sin calentarlas.', 'Relacionar la longitud de onda de la luz con la energía de sus fotones (E = 119 627 / λ).', 5, 220, 12,
  'Ar', 3, 18, 'El argón se usa en lámparas: aquí la protagonista es la luz.', '{"parametros":{"T":350,"P":60,"V":12,"UV":0,"lambda":400},"carga":{"H2":50,"O2":25}}'::jsonb, ARRAY['UV', 'lambda']::text[], ARRAY['H2', 'O2']::text[])
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n08-fotolisis'), 1, 'Enciende la lámpara', 'Enciende la luz UV con una intensidad de 500 W/m² o más.', 'La luz está formada por fotones: paquetes de energía.', '{"todas":[{"metrica":"uv","op":">=","valor":500}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pa.orden = 1), 1, 'Busca el control con el sol.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pa.orden = 1), 2, 'La intensidad indica cuántos fotones llegan.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pa.orden = 1), 3, 'Intensidad 800 W/m².', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n08-fotolisis'), 2, 'Elige la longitud de onda', 'Ajusta la longitud de onda para romper el enlace O=O (498 kJ/mol) y logra 3 fotólisis.', 'Cuanto más corta es la longitud de onda, más energía tiene cada fotón: E = 119 627 / λ (kJ/mol, λ en nm).', '{"todas":[{"metrica":"lambda","op":"<=","valor":240},{"metrica":"fotolisis:O2","op":">=","valor":3}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pa.orden = 2), 1, 'Necesitas fotones con al menos 498 kJ/mol.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pa.orden = 2), 2, 'λ = 119 627 / 498 ≈ 240 nm. Debes estar por debajo.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pa.orden = 2), 3, 'Longitud de onda 185 nm.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n08-fotolisis'), 3, 'Forma agua sin fuego', 'Deja que los radicales O· reaccionen hasta tener 10 moléculas de agua.', 'Un radical (O·) tiene un electrón sin pareja y reacciona casi sin energía de activación.', '{"todas":[{"metrica":"conteo:H2O","op":">=","valor":10}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pa.orden = 3), 1, 'Solo espera con la luz encendida.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pa.orden = 3), 2, 'Más intensidad = más fotones = más radicales.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pa.orden = 3), 3, 'Intensidad 1000 W/m² y espera.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n08-fotolisis'), 1, 'Si la longitud de onda disminuye, la energía del fotón…', 'E es inversamente proporcional a λ.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 1);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 1), 1, 'aumenta', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 1), 2, 'disminuye', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 1), 3, 'no cambia', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n08-fotolisis'), 2, '¿Qué es un radical?', 'Una especie con un electrón desapareado, muy reactiva.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 2);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 2), 1, 'Una especie con un electrón desapareado', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 2), 2, 'Un ion positivo', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 2), 3, 'Un gas noble', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n08-fotolisis'), 3, 'Para romper O=O (498 kJ/mol) se necesita λ menor que…', '119 627 / 498 ≈ 240 nm.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 3);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 3), 1, '240 nm', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 3), 2, '400 nm', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n08-fotolisis' AND pr.orden = 3), 3, '700 nm', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES ('n09-cadena', (SELECT id FROM mision WHERE codigo = 'luz'), 9, 'Reacción en cadena', 'Un solo fotón puede iniciar cientos de reacciones: descubre cómo.', 'Distinguir las etapas de iniciación, propagación y terminación de una reacción en cadena.', 5, 250, 14,
  'Br', 4, 17, 'El bromo, como el cloro, es un halógeno: sus moléculas se rompen con luz visible o UV cercana.', '{"parametros":{"T":320,"P":2,"V":12,"UV":0,"lambda":350},"carga":{"H2":60,"Cl2":60}}'::jsonb, ARRAY['UV', 'lambda']::text[], ARRAY['H2', 'Cl2']::text[])
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n09-cadena'), 1, 'Iniciación', 'Ilumina la mezcla para romper moléculas de Cl₂ (logra 3 fotólisis).', 'Iniciación: la luz rompe Cl₂ en dos radicales Cl·.', '{"todas":[{"metrica":"fotolisis:Cl2","op":">=","valor":3}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 1), 1, 'Enciende la luz UV.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 1), 2, 'El enlace Cl–Cl es débil (243 kJ/mol): basta luz de 350 nm.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 1), 3, 'Intensidad 700 W/m² y λ = 350 nm.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n09-cadena'), 2, 'Propagación', 'Observa cómo cada radical genera otro: logra 5 reacciones Cl· + H₂ y 5 de H· + Cl₂.', 'Propagación: un radical reacciona y produce otro radical, que continúa la cadena.', '{"todas":[{"metrica":"reacciones:clh2","op":">=","valor":5},{"metrica":"reacciones:hcl2","op":">=","valor":5}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 2), 1, 'Mantén la luz encendida.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 2), 2, 'Mira la consola de eventos: verás «Propagación (cadena)».', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 2), 3, 'Espera unos segundos con λ = 350 nm.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n09-cadena'), 3, 'Producto', 'Acumula 30 moléculas de HCl.', 'Balance global: H₂ + Cl₂ → 2HCl.', '{"todas":[{"metrica":"conteo:HCl","op":">=","valor":30}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 3), 1, 'La cadena hace el trabajo por ti.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 3), 2, 'Más intensidad acelera la iniciación.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 3), 3, 'Intensidad 1000 W/m².', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n09-cadena'), 4, 'Terminación', 'Apaga la luz y observa cómo dos radicales se unen y terminan la cadena.', 'Terminación: dos radicales se combinan (Cl· + Cl· → Cl₂) y la cadena se detiene.', '{"todas":[{"metrica":"uv","op":"<=","valor":0},{"metrica":"reacciones:clcl","op":">=","valor":1}]}'::jsonb)
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 4), 1, 'Lleva la intensidad a 0.', 5)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 4), 2, 'Las terminaciones ocurren solas con el tiempo.', 10)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = 'n09-cadena' AND pa.orden = 4), 3, 'Intensidad 0 W/m² y espera.', 20)
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n09-cadena'), 1, '¿Qué etapa produce los primeros radicales?', 'La iniciación.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 1);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 1), 1, 'Iniciación', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 1), 2, 'Propagación', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 1), 3, 'Terminación', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n09-cadena'), 2, 'En la propagación, un radical…', 'Reacciona y genera otro radical.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 2);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 2), 1, 'reacciona y genera otro radical', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 2), 2, 'desaparece sin reaccionar', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 2), 3, 'se convierte en luz', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = 'n09-cadena'), 3, '¿Qué ocurre en la terminación?', 'Dos radicales se unen y la cadena se detiene.')
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;
UPDATE opcion SET es_correcta = false WHERE pregunta_id = (SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 3);
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 3), 1, 'Dos radicales se unen', true)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 3), 2, 'Se rompen más moléculas', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES ((SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = 'n09-cadena' AND pr.orden = 3), 3, 'Se emite un fotón', false)
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;
UPDATE nivel n SET nivel_previo_id = (SELECT p.id FROM nivel p WHERE p.orden = n.orden - 1);
--rollback DELETE FROM opcion; DELETE FROM pregunta; DELETE FROM pista; DELETE FROM paso; UPDATE nivel SET nivel_previo_id = NULL; DELETE FROM nivel;

--changeset adriana.laos:901-3 runOnChange:true comment:Semilla de insignias y glosario de Quimi
INSERT INTO insignia (codigo, nombre, descripcion, icono, tipo, umbral) VALUES
  ('primer-experimento', 'Primer experimento', 'Completaste tu primer nivel.', 'flask', 'niveles_completados', 1),
  ('cientifico-curioso', 'Científico curioso', 'Completaste 5 niveles.', 'microscope', 'niveles_completados', 5),
  ('tabla-completa', 'Tabla completa', 'Completaste todos los niveles.', 'grid', 'niveles_completados', 9),
  ('sin-ayuda', 'Sin ayuda', 'Completaste un nivel sin usar pistas.', 'sparkles', 'sin_pistas', 1),
  ('racha-3', 'Constancia', 'Practicaste 3 días seguidos.', 'flame', 'racha', 3),
  ('coleccionista', 'Coleccionista de estrellas', 'Reuniste 20 estrellas.', 'star', 'estrellas_totales', 20),
  ('xp-1000', 'Mil de experiencia', 'Alcanzaste 1000 XP.', 'zap', 'xp_total', 1000),
  ('cuestionario-perfecto', 'Mente brillante', 'Respondiste perfecto 3 cuestionarios.', 'brain', 'cuestionarios_perfectos', 3)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, icono = EXCLUDED.icono, tipo = EXCLUDED.tipo, umbral = EXCLUDED.umbral;
INSERT INTO glosario (termino, definicion) VALUES
  ('Átomo', 'La partícula más pequeña de un elemento que conserva sus propiedades. Ejemplo: un átomo de oxígeno (O).'),
  ('Molécula', 'Grupo de dos o más átomos unidos por enlaces. Ejemplo: H₂O tiene dos hidrógenos y un oxígeno.'),
  ('Temperatura', 'Medida de la energía de movimiento promedio de las partículas. En el simulador se usa kelvin (K).'),
  ('Kelvin', 'Unidad de temperatura absoluta. K = °C + 273. El cero absoluto (0 K) es la temperatura más baja posible.'),
  ('Energía cinética', 'Energía que tiene un cuerpo por estar en movimiento. Las partículas más rápidas tienen más energía cinética.'),
  ('Presión', 'Fuerza que ejercen las partículas al chocar contra las paredes. Se mide en atmósferas (atm).'),
  ('Volumen', 'Espacio que ocupa la materia. En la cámara se mide en litros (L).'),
  ('Estado sólido', 'Las partículas están muy juntas y ordenadas; solo vibran en su lugar.'),
  ('Estado líquido', 'Las partículas están juntas pero pueden deslizarse unas sobre otras.'),
  ('Estado gaseoso', 'Las partículas están separadas y se mueven libremente en todas direcciones.'),
  ('Plasma', 'Gas tan caliente que sus átomos pierden electrones. Ejemplo: el Sol o un rayo.'),
  ('Fusión', 'Cambio de sólido a líquido al recibir energía. El hielo se funde a 273 K.'),
  ('Ebullición', 'Cambio de líquido a gas en todo el líquido. Depende de la presión.'),
  ('Condensación', 'Cambio de gas a líquido al perder energía.'),
  ('Sublimación', 'Paso directo de sólido a gas, como el hielo seco (CO₂ sólido).'),
  ('Punto de ebullición', 'Temperatura a la que un líquido hierve. Sube si aumenta la presión.'),
  ('Reacción química', 'Proceso en el que unas sustancias (reactivos) se transforman en otras (productos).'),
  ('Reactivo', 'Sustancia inicial de una reacción; se escribe a la izquierda de la flecha.'),
  ('Producto', 'Sustancia que se forma en una reacción; se escribe a la derecha de la flecha.'),
  ('Energía de activación', 'Energía mínima que necesita un choque entre partículas para que ocurra la reacción. Se escribe Eₐ.'),
  ('Entalpía de reacción', 'Energía absorbida o liberada en una reacción (ΔH). Negativa: libera energía; positiva: absorbe.'),
  ('Reacción exotérmica', 'Reacción que libera energía al entorno (ΔH < 0). Ejemplo: una combustión.'),
  ('Reacción endotérmica', 'Reacción que absorbe energía del entorno (ΔH > 0).'),
  ('Combustión', 'Reacción rápida de una sustancia con oxígeno que libera energía en forma de calor y luz.'),
  ('Colisión efectiva', 'Choque entre partículas con la energía y orientación suficientes para producir una reacción.'),
  ('Enlace químico', 'Unión entre átomos. Romper un enlace requiere energía; formarlo la libera.'),
  ('Enlace iónico', 'Enlace entre iones de carga opuesta, como Na⁺ y Cl⁻ en la sal de mesa.'),
  ('Radical', 'Átomo o molécula con un electrón desapareado. Es muy reactivo; se marca con un punto: Cl·.'),
  ('Fotón', 'Paquete de energía de la luz.'),
  ('Longitud de onda', 'Distancia entre dos crestas de una onda de luz (λ, en nanómetros). Más corta = más energía.'),
  ('Fotólisis', 'Ruptura de una molécula por acción de la luz.'),
  ('Reacción en cadena', 'Reacción en la que cada paso genera una especie que provoca el siguiente: iniciación, propagación y terminación.'),
  ('Metales alcalinos', 'Elementos del grupo 1 (Li, Na, K…). Tienen un electrón externo y son muy reactivos.'),
  ('Halógenos', 'Elementos del grupo 17 (F, Cl, Br, I). Les falta un electrón para completar su capa externa.'),
  ('Masa molar', 'Masa de un mol de una sustancia, en gramos por mol (g/mol).'),
  ('Mol', 'Cantidad de sustancia que contiene 6,022 × 10²³ partículas.'),
  ('Conservación de la masa', 'En una reacción química los átomos no se crean ni se destruyen, solo se reorganizan.'),
  ('Experiencia (XP)', 'Puntos que ganas al completar pasos y niveles. Usar pistas cuesta XP.'),
  ('Estrellas', 'Calificación de 1 a 3 por nivel: menos pistas y mejor cuestionario dan más estrellas.')
ON CONFLICT (termino) DO UPDATE SET definicion = EXCLUDED.definicion;
--rollback DELETE FROM glosario; DELETE FROM insignia;
