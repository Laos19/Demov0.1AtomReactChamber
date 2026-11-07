output "api_url" {
  description = "URL que tendría la API detrás del ALB (referencial)."
  value       = "http://${aws_lb.api.dns_name}"
}

output "database_host" {
  description = "Host que tendría RDS (referencial)."
  value       = aws_db_instance.main.address
}

output "web_url" {
  description = "URL que tendría el frontend en CloudFront (referencial)."
  value       = "https://${aws_cloudfront_distribution.web.domain_name}"
}
