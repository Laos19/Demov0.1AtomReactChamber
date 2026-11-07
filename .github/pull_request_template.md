## Descripción

<!-- ¿Qué cambia y por qué? Enlace al issue: Cierra #123 -->

## Tipo de cambio

<!-- El título del PR debe seguir Conventional Commits (feat:, fix:, db:, docs:, ci:, refactor:, test:, chore:).
     release-please lo usa para calcular la versión y el CHANGELOG. -->

- [ ] `feat` — nueva funcionalidad
- [ ] `fix` — corrección de error
- [ ] `db` — cambio de esquema / datos (changeset Liquibase)
- [ ] `docs` — documentación
- [ ] `ci` / `build` — automatizaciones o infraestructura
- [ ] `refactor` / `test` / `chore`
- [ ] Cambio incompatible (`!` o `BREAKING CHANGE:`)

## Cómo se probó

<!-- Comandos ejecutados, capturas, casos de prueba. -->

- [ ] `npm test` en local
- [ ] `npm run e2e -w frontend`
- [ ] Probado manualmente en modo demo / con API

## Base de datos

- [ ] No aplica
- [ ] Nuevo changeset en `db/changelog/sql/` con `--rollback`
- [ ] Probado con `liquibase update` + `rollback-count 1` en BD local
- [ ] Diccionario de datos / comentarios (`COMMENT ON`) actualizados

## Lista de verificación

- [ ] El código sigue el estándar de programación del proyecto (`docs/`)
- [ ] No hay secretos, contraseñas ni datos personales en el código
- [ ] Se actualizó la documentación afectada (README, manuales, FD)
- [ ] Los workflows de CI están en verde
- [ ] Accesibilidad revisada si hay cambios de interfaz (teclado, contraste, textos alternativos)
