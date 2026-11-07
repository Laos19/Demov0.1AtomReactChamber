# API Fastify (Node 22) como Web Service nativo de Render.
resource "render_web_service" "api" {
  name              = local.api_name
  plan              = var.api_plan
  region            = var.region
  start_command     = var.api_start_command
  health_check_path = var.api_health_check_path

  runtime_source = {
    native_runtime = {
      repo_url            = var.repo_url
      branch              = var.branch
      runtime             = "node"
      build_command       = var.api_build_command
      auto_deploy_trigger = var.auto_deploy_trigger

      build_filter = {
        paths         = ["backend/**", "package.json", "package-lock.json"]
        ignored_paths = ["backend/**/*.test.ts", "backend/test/**"]
      }
    }
  }

  env_vars = {
    NODE_VERSION = { value = var.node_version }
    DATABASE_URL = { value = var.database_url }
    CORS_ORIGIN  = { value = local.cors_origins }
    # Render genera un valor aleatorio; nunca pasa por el repositorio.
    JWT_SECRET = { generate_value = true }
  }
}

# Frontend React (Vite) como Static Site de Render (CDN global, gratuito).
resource "render_static_site" "web" {
  name                = local.web_name
  repo_url            = var.repo_url
  branch              = var.branch
  build_command       = var.web_build_command
  publish_path        = var.web_publish_path
  auto_deploy_trigger = var.auto_deploy_trigger

  build_filter = {
    paths = ["frontend/**", "package.json", "package-lock.json"]
  }

  env_vars = {
    NODE_VERSION = { value = var.node_version }
    VITE_API_URL = { value = render_web_service.api.url }
  }

  headers = [
    {
      path  = "/*"
      name  = "X-Frame-Options"
      value = "SAMEORIGIN"
    },
    {
      path  = "/*"
      name  = "X-Content-Type-Options"
      value = "nosniff"
    },
    {
      path  = "/*"
      name  = "Referrer-Policy"
      value = "strict-origin-when-cross-origin"
    },
    {
      path  = "/assets/*"
      name  = "Cache-Control"
      value = "public, max-age=31536000, immutable"
    },
  ]

  # SPA: cualquier ruta del cliente se resuelve con index.html.
  routes = [
    {
      type        = "rewrite"
      source      = "/*"
      destination = "/index.html"
    },
  ]
}
