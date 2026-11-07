locals {
  api_name = "${var.name_prefix}-api"
  web_name = "${var.name_prefix}-web"

  # La URL del sitio estático se predice a partir de su nombre para evitar una
  # dependencia circular (la web necesita la URL de la API en build y la API
  # necesita la URL de la web para CORS).
  predicted_web_url = "https://${local.web_name}.onrender.com"
  cors_origins      = join(",", concat([local.predicted_web_url], var.extra_cors_origins))
}
