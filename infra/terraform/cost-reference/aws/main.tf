# Arquitectura AWS equivalente (de pago) a Neon + Render, usada SOLO para comparar costos.
#   PostgreSQL  -> Amazon RDS for PostgreSQL 16 (db.t4g.micro, gp3 20 GB, Single-AZ)
#   API         -> Amazon ECS Fargate (0.25 vCPU / 0.5 GB, ARM64) + Application Load Balancer
#   Frontend    -> Amazon S3 + CloudFront
#   Secretos    -> AWS Secrets Manager

# Salvaguarda: cualquier plan/apply real falla mientras allow_apply sea false.
resource "terraform_data" "guard" {
  lifecycle {
    precondition {
      condition     = var.allow_apply
      error_message = "cost-reference/aws es solo para Infracost. No aplicar."
    }
  }
}

resource "aws_db_instance" "main" {
  identifier                   = "${var.project_name}-db"
  engine                       = "postgres"
  engine_version               = "16"
  instance_class               = var.db_instance_class
  allocated_storage            = var.db_storage_gb
  storage_type                 = "gp3"
  storage_encrypted            = true
  db_name                      = "atomreactchamber"
  username                     = "app_owner"
  manage_master_user_password  = true
  multi_az                     = false
  publicly_accessible          = false
  backup_retention_period      = 7
  deletion_protection          = true
  skip_final_snapshot          = false
  final_snapshot_identifier    = "${var.project_name}-db-final"
  performance_insights_enabled = false
}

resource "aws_secretsmanager_secret" "jwt" {
  name = "${var.project_name}/jwt-secret"
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name         = "api"
      image        = var.api_container_image
      essential    = true
      command      = ["node", "backend/dist/server.js"]
      portMappings = [{ containerPort = 8080, protocol = "tcp" }]
    }
  ])
}

resource "aws_lb" "api" {
  name               = "${var.project_name}-alb"
  load_balancer_type = "application"
  internal           = false
  subnets            = var.subnet_ids
}

resource "aws_lb_target_group" "api" {
  name        = "${var.project_name}-api"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    path = "/api/health"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = var.subnet_ids
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_s3_bucket" "web" {
  bucket_prefix = "${var.project_name}-web-"
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket = aws_s3_bucket.web.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "web" {
  name                              = "${var.project_name}-web-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = "s3-web"
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-web"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    # Managed-CachingOptimized
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
