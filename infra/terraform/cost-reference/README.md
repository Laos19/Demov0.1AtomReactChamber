# Referencia de costos (solo estimación)

> ⚠️ Los directorios `aws/` y `azure/` describen una arquitectura **equivalente de pago** a la
> que realmente usa el proyecto (Neon + Render + GitHub Pages, USD 0). Existen **solo** para que
> [Infracost](https://www.infracost.io/) calcule cuánto costaría migrar. **Nunca se aplican**:
> cada uno tiene un recurso `terraform_data.guard` cuya precondición (`allow_apply = false`)
> hace fallar cualquier `terraform plan/apply` real.

## Arquitectura desplegada (capa gratuita)

| Componente | Servicio | Plan | Límites relevantes del plan gratuito | Costo mensual |
|---|---|---|---|---:|
| PostgreSQL 16 | Neon | Free | 0.5 GB de almacenamiento por proyecto, cómputo con autosuspensión, PITR 6 h | USD 0.00 |
| API Fastify | Render Web Service | Free | 512 MB RAM, se suspende tras 15 min sin tráfico (arranque en frío ~1 min) | USD 0.00 |
| Frontend | Render Static Site | Free | CDN global, 100 GB/mes de ancho de banda | USD 0.00 |
| Docs + demo | GitHub Pages | Gratis | Repositorio público, 1 GB de sitio | USD 0.00 |
| Estado Terraform | HCP Terraform | Free | Hasta 500 recursos gestionados | USD 0.00 |
| CI/CD | GitHub Actions | Gratis | Minutos ilimitados en repositorios públicos | USD 0.00 |
| **Total** | | | | **USD 0.00** |

Los límites cambian con el tiempo: verifíquelos en las páginas oficiales de precios
([Neon](https://neon.com/pricing), [Render](https://render.com/pricing),
[HCP Terraform](https://www.hashicorp.com/products/terraform/pricing),
[GitHub](https://docs.github.com/billing)).

## Arquitectura equivalente de pago

<!-- precios:inicio -->
Precios de lista **aproximados** (on-demand, región `us-east-1` / `eastus`, USD, 730 h/mes),
tomados de las calculadoras oficiales; son una referencia docente y deben confirmarse con
Infracost (`INFRACOST_API_KEY`) o con la calculadora del proveedor antes de usarse en un presupuesto.

| Nube | Componente | Recurso de referencia | Cálculo | USD/mes aprox. |
|---|---|---|---|---:|
| AWS | PostgreSQL | RDS for PostgreSQL `db.t4g.micro` Single-AZ | 0.016 USD/h × 730 h | 11.68 |
| AWS | Almacenamiento BD | RDS gp3 20 GB | 0.115 USD/GB-mes × 20 | 2.30 |
| AWS | API | ECS Fargate ARM64 0.25 vCPU / 0.5 GB | (0.25 × 0.03238 + 0.5 × 0.00356) USD/h × 730 h | 7.21 |
| AWS | Balanceador | Application Load Balancer | 0.0225 USD/h × 730 h + LCU | 16.43 + uso |
| AWS | Frontend | S3 (1 GB) + CloudFront | Dentro del nivel gratuito permanente de CloudFront (1 TB/mes) | ~0.03 |
| AWS | Secretos | Secrets Manager (1 secreto) | 0.40 USD/secreto-mes | 0.40 |
| **AWS** | **Total** | | | **≈ 38** |
| Azure | PostgreSQL | Flexible Server `B_Standard_B1ms` + 32 GB | cómputo + almacenamiento | ≈ 16 |
| Azure | API | App Service Linux plan B1 | 1 instancia | ≈ 13 |
| Azure | Frontend | Static Web Apps Standard | tarifa plana | 9.00 |
| **Azure** | **Total** | | | **≈ 38** |

Fuentes: [Amazon RDS for PostgreSQL pricing](https://aws.amazon.com/rds/postgresql/pricing/),
[AWS Fargate pricing](https://aws.amazon.com/fargate/pricing/),
[Elastic Load Balancing pricing](https://aws.amazon.com/elasticloadbalancing/pricing/),
[Amazon CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/),
[AWS Secrets Manager pricing](https://aws.amazon.com/secrets-manager/pricing/),
[Azure Database for PostgreSQL pricing](https://azure.microsoft.com/pricing/details/postgresql/flexible-server/),
[Azure App Service pricing](https://azure.microsoft.com/pricing/details/app-service/linux/),
[Azure Static Web Apps pricing](https://azure.microsoft.com/pricing/details/app-service/static/).
<!-- precios:fin -->

## Cómo estimar localmente

```bash
infracost auth login                      # o export INFRACOST_API_KEY=...
infracost breakdown --path infra/terraform/cost-reference/aws \
  --usage-file infra/terraform/cost-reference/aws/infracost-usage.yml
infracost breakdown --path infra/terraform/cost-reference/azure
```
