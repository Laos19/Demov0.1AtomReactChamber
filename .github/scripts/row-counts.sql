-- Conteo exacto de filas por tabla (todas las tablas de usuario).
-- Salida CSV: esquema.tabla,filas
SELECT format('%s.%s', table_schema, table_name) AS tabla,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name),
                           false, true, '')))[1]::text::bigint AS filas
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ('pg_catalog', 'information_schema')
  AND table_schema NOT LIKE 'pg_toast%'
ORDER BY 1;
