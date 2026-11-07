terraform {
  required_version = ">= 1.9"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.18"
    }
    render = {
      source  = "render-oss/render"
      version = "~> 1.9"
    }
  }
}
