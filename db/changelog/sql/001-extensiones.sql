--liquibase formatted sql

--changeset adriana.laos:001-1 comment:Extensión unaccent para búsquedas sin tildes (glosario de Quimi)
CREATE EXTENSION IF NOT EXISTS unaccent;
--rollback DROP EXTENSION IF EXISTS unaccent;

--changeset adriana.laos:001-2 comment:Configuración de búsqueda de texto completo en español sin tildes
CREATE TEXT SEARCH CONFIGURATION es_sin_tildes (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION es_sin_tildes
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;
--rollback DROP TEXT SEARCH CONFIGURATION IF EXISTS es_sin_tildes;
