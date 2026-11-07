# Diagrama de despliegue

> Generado automáticamente por `scripts/docs/build-diagrams.mjs`. No editar a mano.

Infraestructura aprovisionada con Terraform (módulos: database (database-neon), app (app-render)) y automatizada con GitHub Actions. Costo mensual en free tier: US$ 0 (ver infra/terraform/cost-reference).

```mermaid
flowchart TB
  usuario(["Estudiante / Docente<br/>navegador"])
  dev(["Desarrolladora<br/>git push"])
  subgraph GitHub
    repo["Repositorio"]
    gha["GitHub Actions<br/>infra · db · backup · release · docs · pages"]
    pages["GitHub Pages<br/>docs técnicas + demo offline"]
    rel["Releases<br/>dist + .vsix + backups"]
  end
  subgraph Render["Render (free tier)"]
    web["Sitio estático<br/>frontend/dist"]
    api["Web service Node 22<br/>backend/dist/server.js"]
  end
  subgraph Neon["Neon (free tier)"]
    pg[("PostgreSQL 16")]
  end
  hcp["HCP Terraform<br/>estado remoto"]
  dev --> repo --> gha
  gha -- "terraform apply" --> Render
  gha -- "terraform apply" --> Neon
  gha -. "estado" .-> hcp
  gha -- "liquibase update" --> pg
  gha -- "pg_dump diario" --> rel
  gha -- "deploy pages" --> pages
  gha -- "deploy hook" --> api
  usuario -- HTTPS --> web
  usuario -- "HTTPS /api" --> api
  usuario -- HTTPS --> pages
  api -- "TLS 5432" --> pg
```
