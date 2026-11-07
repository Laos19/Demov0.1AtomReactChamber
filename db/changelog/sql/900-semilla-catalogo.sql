--liquibase formatted sql
-- ARCHIVO GENERADO por db/scripts/generate-seed.mjs — no editar a mano.

--changeset adriana.laos:900-1 runOnChange:true comment:Semilla de roles
INSERT INTO rol (codigo, nombre) VALUES ('estudiante', 'Estudiante'), ('docente', 'Docente'), ('admin', 'Administrador')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
--rollback DELETE FROM rol;

--changeset adriana.laos:900-2 runOnChange:true comment:Semilla de elementos
INSERT INTO elemento (simbolo, nombre, numero_atomico, color_hex, brillo_hex, radio_px) VALUES
  ('H', 'Hidrógeno', 1, '#e2e8f0', '#ffffff', 4),
  ('C', 'Carbono', 6, '#94a3b8', '#e2e8f0', 6.5),
  ('O', 'Oxígeno', 8, '#f87171', '#fecaca', 6),
  ('Na', 'Sodio', 11, '#a78bfa', '#ddd6fe', 8),
  ('Cl', 'Cloro', 17, '#4ade80', '#bbf7d0', 7)
ON CONFLICT (simbolo) DO UPDATE SET nombre = EXCLUDED.nombre, numero_atomico = EXCLUDED.numero_atomico, color_hex = EXCLUDED.color_hex, brillo_hex = EXCLUDED.brillo_hex, radio_px = EXCLUDED.radio_px;
--rollback DELETE FROM elemento;

--changeset adriana.laos:900-3 runOnChange:true comment:Semilla de especies y su geometría
INSERT INTO especie (codigo, formula, nombre, masa_molar, dhf_kj_mol, punto_fusion_k, punto_ebull_k, dhvap_kj_mol, p_triple_atm, t_triple_k, dhvap_triple, pubchem_cid, es_radical, inyectable, orden) VALUES
  ('H2', 'H₂', 'Hidrógeno', 2.016, 0, 14, 20.3, 0.9, NULL, NULL, NULL, 783, false, true, 1),
  ('O2', 'O₂', 'Oxígeno', 31.998, 0, 54.4, 90.2, 6.8, NULL, NULL, NULL, 977, false, true, 2),
  ('Na', 'Na', 'Sodio', 22.99, 0, 370.9, 1156, 97.4, NULL, NULL, NULL, 5360545, false, true, 3),
  ('H2O', 'H₂O', 'Agua', 18.015, -241.8, 273.15, 373.15, 40.7, NULL, NULL, NULL, 962, false, true, 4),
  ('Cl2', 'Cl₂', 'Cloro', 70.9, 0, 171.6, 239.1, 20.4, NULL, NULL, NULL, 24526, false, true, 5),
  ('C', 'C', 'Carbono (grafito)', 12.011, 0, 3800, 4100, 715, NULL, NULL, NULL, 5462310, false, true, 6),
  ('NaOH', 'NaOH', 'Hidróxido de sodio', 39.997, -425.8, 591, 1661, 175, NULL, NULL, NULL, 14798, false, false, 7),
  ('NaCl', 'NaCl', 'Cloruro de sodio', 58.44, -411.2, 1074, 1686, 171, NULL, NULL, NULL, 5234, false, false, 8),
  ('CO2', 'CO₂', 'Dióxido de carbono', 44.009, -393.5, 216.6, 194.7, 25.2, 5.1, 216.6, 16.7, 280, false, false, 9),
  ('HCl', 'HCl', 'Cloruro de hidrógeno', 36.46, -92.3, 159, 188, 16.2, NULL, NULL, NULL, 313, false, false, 10),
  ('H', 'H·', 'Hidrógeno atómico (radical)', 1.008, 218, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, false, 11),
  ('O', 'O·', 'Oxígeno atómico (radical)', 15.999, 249.2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, false, 12),
  ('Cl', 'Cl·', 'Cloro atómico (radical)', 35.45, 121.3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, false, 13)
ON CONFLICT (codigo) DO UPDATE SET formula = EXCLUDED.formula, nombre = EXCLUDED.nombre, masa_molar = EXCLUDED.masa_molar,
  dhf_kj_mol = EXCLUDED.dhf_kj_mol, punto_fusion_k = EXCLUDED.punto_fusion_k, punto_ebull_k = EXCLUDED.punto_ebull_k,
  dhvap_kj_mol = EXCLUDED.dhvap_kj_mol, p_triple_atm = EXCLUDED.p_triple_atm, t_triple_k = EXCLUDED.t_triple_k,
  dhvap_triple = EXCLUDED.dhvap_triple, pubchem_cid = EXCLUDED.pubchem_cid, es_radical = EXCLUDED.es_radical,
  inyectable = EXCLUDED.inyectable, orden = EXCLUDED.orden;
DELETE FROM especie_atomo;
INSERT INTO especie_atomo (especie_codigo, posicion, simbolo, x, y) VALUES
  ('H2', 1, 'H', -3.5, 0),
  ('H2', 2, 'H', 3.5, 0),
  ('O2', 1, 'O', -5, 0),
  ('O2', 2, 'O', 5, 0),
  ('Na', 1, 'Na', 0, 0),
  ('H2O', 1, 'O', 0, -1.5),
  ('H2O', 2, 'H', -6, 3.5),
  ('H2O', 3, 'H', 6, 3.5),
  ('Cl2', 1, 'Cl', -6, 0),
  ('Cl2', 2, 'Cl', 6, 0),
  ('C', 1, 'C', 0, 0),
  ('NaOH', 1, 'Na', -6, 0),
  ('NaOH', 2, 'O', 5, 0),
  ('NaOH', 3, 'H', 11, -3),
  ('NaCl', 1, 'Na', -6, 0),
  ('NaCl', 2, 'Cl', 6, 0),
  ('CO2', 1, 'O', -10, 0),
  ('CO2', 2, 'C', 0, 0),
  ('CO2', 3, 'O', 10, 0),
  ('HCl', 1, 'H', -6, 0),
  ('HCl', 2, 'Cl', 3, 0),
  ('H', 1, 'H', 0, 0),
  ('O', 1, 'O', 0, 0),
  ('Cl', 1, 'Cl', 0, 0);
--rollback DELETE FROM especie_atomo; DELETE FROM especie;

--changeset adriana.laos:900-4 runOnChange:true comment:Semilla de reacciones, participantes y fotólisis
INSERT INTO reaccion (codigo, etiqueta, ea_kj_mol, factor_esterico, enlace) VALUES
  ('h2o2', 'Iniciación térmica', 34, 0.6, 'H–O'),
  ('oh2', 'Propagación', 10, 0.8, 'H–O'),
  ('naw', 'Transferencia electrónica', 34, 0.8, 'Na–O'),
  ('hh', 'Recombinación radicalaria', 0, 0.3, 'H–H'),
  ('oo', 'Recombinación radicalaria', 0, 0.25, 'O=O'),
  ('nacl2', 'Oxidación del metal', 6, 0.7, 'Na–Cl'),
  ('nacl', 'Captura de radical', 0, 0.6, 'Na–Cl'),
  ('co2', 'Combustión del carbono', 38, 0.5, 'C=O'),
  ('clh2', 'Propagación (cadena)', 10, 0.6, 'H–Cl'),
  ('hcl2', 'Propagación (cadena)', 5, 0.7, 'H–Cl'),
  ('hcl', 'Terminación', 0, 0.3, 'H–Cl'),
  ('clcl', 'Terminación', 0, 0.25, 'Cl–Cl')
ON CONFLICT (codigo) DO UPDATE SET etiqueta = EXCLUDED.etiqueta, ea_kj_mol = EXCLUDED.ea_kj_mol, factor_esterico = EXCLUDED.factor_esterico, enlace = EXCLUDED.enlace;
DELETE FROM reaccion_participante;
INSERT INTO reaccion_participante (reaccion_codigo, papel, posicion, especie_codigo) VALUES
  ('h2o2', 'reactivo', 1, 'H2'),
  ('h2o2', 'reactivo', 2, 'O2'),
  ('h2o2', 'producto', 1, 'H2O'),
  ('h2o2', 'producto', 2, 'O'),
  ('oh2', 'reactivo', 1, 'O'),
  ('oh2', 'reactivo', 2, 'H2'),
  ('oh2', 'producto', 1, 'H2O'),
  ('naw', 'reactivo', 1, 'Na'),
  ('naw', 'reactivo', 2, 'H2O'),
  ('naw', 'producto', 1, 'NaOH'),
  ('naw', 'producto', 2, 'H'),
  ('hh', 'reactivo', 1, 'H'),
  ('hh', 'reactivo', 2, 'H'),
  ('hh', 'producto', 1, 'H2'),
  ('oo', 'reactivo', 1, 'O'),
  ('oo', 'reactivo', 2, 'O'),
  ('oo', 'producto', 1, 'O2'),
  ('nacl2', 'reactivo', 1, 'Na'),
  ('nacl2', 'reactivo', 2, 'Cl2'),
  ('nacl2', 'producto', 1, 'NaCl'),
  ('nacl2', 'producto', 2, 'Cl'),
  ('nacl', 'reactivo', 1, 'Na'),
  ('nacl', 'reactivo', 2, 'Cl'),
  ('nacl', 'producto', 1, 'NaCl'),
  ('co2', 'reactivo', 1, 'C'),
  ('co2', 'reactivo', 2, 'O2'),
  ('co2', 'producto', 1, 'CO2'),
  ('clh2', 'reactivo', 1, 'Cl'),
  ('clh2', 'reactivo', 2, 'H2'),
  ('clh2', 'producto', 1, 'HCl'),
  ('clh2', 'producto', 2, 'H'),
  ('hcl2', 'reactivo', 1, 'H'),
  ('hcl2', 'reactivo', 2, 'Cl2'),
  ('hcl2', 'producto', 1, 'HCl'),
  ('hcl2', 'producto', 2, 'Cl'),
  ('hcl', 'reactivo', 1, 'H'),
  ('hcl', 'reactivo', 2, 'Cl'),
  ('hcl', 'producto', 1, 'HCl'),
  ('clcl', 'reactivo', 1, 'Cl'),
  ('clcl', 'reactivo', 2, 'Cl'),
  ('clcl', 'producto', 1, 'Cl2');
INSERT INTO fotolisis (especie_codigo, enlace_kj_mol, seccion_eficaz, etiqueta, producto_1, producto_2) VALUES
  ('O2', 498, 0.0015, 'O=O', 'O', 'O'),
  ('H2', 436, 0.0006, 'H–H', 'H', 'H'),
  ('Cl2', 243, 0.0008, 'Cl–Cl', 'Cl', 'Cl')
ON CONFLICT (especie_codigo) DO UPDATE SET enlace_kj_mol = EXCLUDED.enlace_kj_mol, seccion_eficaz = EXCLUDED.seccion_eficaz, etiqueta = EXCLUDED.etiqueta, producto_1 = EXCLUDED.producto_1, producto_2 = EXCLUDED.producto_2;
--rollback DELETE FROM fotolisis; DELETE FROM reaccion_participante; DELETE FROM reaccion;

--changeset adriana.laos:900-5 runOnChange:true comment:Semilla de presets del laboratorio libre
INSERT INTO preset (codigo, nombre, ecuacion, sobre_flecha, etiqueta, pista, parametros, pasos, orden) VALUES
  ('combustion', 'Combustión de hidrógeno', '2H₂ + O₂ → 2H₂O', 'ΔT', 'Exotérmica', 'Mezcla estable a 700 K: pulsa «Chispa» para iniciar la ignición en cadena.', '{"T":700,"P":1,"V":12,"UV":0,"lambda":254}'::jsonb, '[["h2o2",1],["oh2",1]]'::jsonb, 1),
  ('alkali', 'Reacción álcali–agua', '2Na + 2H₂O → 2NaOH + H₂↑', '', 'Violenta / exotérmica', 'Sodio fundido bajo vapor de agua denso (100 atm, 760 K): cada H₂ formado libera calor y acelera la reacción.', '{"T":760,"P":100,"V":10,"UV":0,"lambda":254}'::jsonb, '[["naw",2],["hh",1]]'::jsonb, 2),
  ('uvwater', 'Síntesis de agua con luz UV', '2H₂ + O₂ → 2H₂O', 'hν, 60 atm', 'Fotoquímica', 'La luz UV-C de 185 nm rompe el enlace O=O (498 kJ/mol); los radicales O· reaccionan con H₂ sin barrera térmica.', '{"T":350,"P":60,"V":12,"UV":800,"lambda":185}'::jsonb, '[["photo:O2",1],["oh2",2]]'::jsonb, 3),
  ('chlor', 'Cadena fotoquímica H₂ + Cl₂', 'H₂ + Cl₂ → 2HCl', 'hν', 'Reacción en cadena', 'La luz UV-A (350 nm) basta para romper Cl–Cl; cada radical Cl· propaga una cadena.', '{"T":320,"P":2,"V":12,"UV":700,"lambda":350}'::jsonb, '[["photo:Cl2",1],["clh2",1],["hcl2",1],["clcl",1]]'::jsonb, 4)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, ecuacion = EXCLUDED.ecuacion, sobre_flecha = EXCLUDED.sobre_flecha,
  etiqueta = EXCLUDED.etiqueta, pista = EXCLUDED.pista, parametros = EXCLUDED.parametros, pasos = EXCLUDED.pasos, orden = EXCLUDED.orden;
DELETE FROM preset_carga;
INSERT INTO preset_carga (preset_codigo, especie_codigo, cantidad) VALUES
  ('combustion', 'H2', 70),
  ('combustion', 'O2', 35),
  ('alkali', 'Na', 30),
  ('alkali', 'H2O', 50),
  ('uvwater', 'H2', 50),
  ('uvwater', 'O2', 25),
  ('chlor', 'H2', 60),
  ('chlor', 'Cl2', 60);
--rollback DELETE FROM preset_carga; DELETE FROM preset;
