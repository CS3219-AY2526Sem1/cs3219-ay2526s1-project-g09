terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  backend "s3" {
    bucket         = "terraform-state-bucket-peerprep"
    key            = "global/infra/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "ap-southeast-1"
}

# S3 Bucket for Collab UI Service
resource "aws_s3_bucket" "collab_ui_service" {
  bucket = "peerprep-staging-collab-ui-service"
}

resource "aws_s3_bucket_policy" "allow_cloudfront_access_to_collab_ui_service" {
  bucket = aws_s3_bucket.collab_ui_service.id
  policy = data.aws_iam_policy_document.allow_cloudfront_access_to_collab_ui_service.json
}

data "aws_iam_policy_document" "allow_cloudfront_access_to_collab_ui_service" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.collab_ui_service.arn}/*",
    ]
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = [aws_cloudfront_distribution.collab_ui_service.arn]
    }
  }
}

# CloudFront CORS configuration for Collab UI Service
resource "aws_s3_bucket_cors_configuration" "frontend_cors" {
  bucket = aws_s3_bucket.collab_ui_service.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "x-amz-meta-custom-header"]
    max_age_seconds = 3600
  }
}

resource "aws_cloudfront_origin_access_control" "collab_ui_service" {
  name                              = "oac-staging-collab-ui-service"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "collab_ui_service" {
  origin {
    domain_name              = aws_s3_bucket.collab_ui_service.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.collab_ui_service.id
    origin_access_control_id = aws_cloudfront_origin_access_control.collab_ui_service.id
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "PeerPrep Collab UI MFE"

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket.collab_ui_service.id
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    compress               = true
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    name        = "peerprep-collab-ui"
    Environment = "staging"
    Project     = "peerprep"
    Service     = "collab-ui"
  }
}

# S3 Bucket for UI Shell
resource "aws_s3_bucket" "ui_shell" {
  bucket = "peerprep-staging-ui-shell"
}

resource "aws_s3_bucket_policy" "allow_cloudfront_access_to_ui_shell" {
  bucket = aws_s3_bucket.ui_shell.id
  policy = data.aws_iam_policy_document.allow_cloudfront_access_to_ui_shell.json
}

data "aws_iam_policy_document" "allow_cloudfront_access_to_ui_shell" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.ui_shell.arn}/*",
    ]
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = [aws_cloudfront_distribution.ui_shell.arn]
    }
  }
}

# CloudFront configuration for UI Shell
resource "aws_cloudfront_origin_access_control" "ui_shell" {
  name                              = "oac-staging-ui-shell"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "ui_shell" {
  origin {
    domain_name              = aws_s3_bucket.ui_shell.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.ui_shell.id
    origin_access_control_id = aws_cloudfront_origin_access_control.ui_shell.id
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "PeerPrep UI Shell"

  default_cache_behavior {
    allowed_methods = [
      "GET",
      "HEAD",
      "OPTIONS",
      "PUT",
      "POST",
      "PATCH",
      "DELETE"
    ]
    cached_methods           = ["GET", "HEAD", "OPTIONS"]
    target_origin_id         = aws_s3_bucket.ui_shell.id
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    compress                 = true
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  custom_error_response {
    error_code            = 403
    response_page_path    = "/index.html"
    response_code         = 200
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_page_path    = "/index.html"
    response_code         = 200
    error_caching_min_ttl = 10
  }

  tags = {
    name        = "peerprep-ui-shell"
    Environment = "staging"
    Project     = "peerprep"
    Service     = "ui-shell"
  }
}

# Elastic Beanstalk Application for Collab Backend Service
resource "aws_elastic_beanstalk_application" "collab_service" {
  name        = "peerprep-staging-collab-service"
  description = "Collab Backend Service"
}

resource "aws_elastic_beanstalk_environment" "collab_service_env" {
  name                = "peerprep-staging-collab-service"
  application         = aws_elastic_beanstalk_application.collab_service.name
  solution_stack_name = "64bit Amazon Linux 2 v4.3.3 running Docker"

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = "aws-elasticbeanstalk-ec2-role"
  }
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = aws_iam_role.eb_service_role.name
  }

  # ------------------
  # Load balancer type
  # ------------------
  # application = ALB (recommended); classic = ELB classic; network = NLB
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "LoadBalancerType"
    value     = "application"
  }

  # ------------------
  # Capacity / ASG
  # ------------------
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MinSize"
    value     = 1
  }
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = 2
  }

  # ------------------
  # Health / Proc
  # ------------------
  # Healthcheck URL for your container (adjust path)
  setting {
    namespace = "aws:elasticbeanstalk:application"
    name      = "Application Healthcheck URL"
    value     = "/api/v1/collab-service/health"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "Port"
    value     = 80
  }
  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "HealthCheckPath"
    value     = "/api/v1/collab-service/health"
  }

  # ------------------
  # Deployment settings
  # ------------------

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DeploymentPolicy"
    value     = "Traffic splitting"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "BatchSizeType"
    value     = "Percentage"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DeploymentBatchSize"
    value     = "100"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TrafficSplit"
    value     = "100"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TrafficSplittingEvaluationTime"
    value     = "5"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "RollingUpdateType"
    value     = "Rolling based on Health"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "BatchSize"
    value     = "1"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "MinimumCapacity"
    value     = "1"
  }

  # ------------------
  # Logs & rolling updates
  # ------------------
  # setting {
  #   namespace = "aws:elasticbeanstalk:hostmanager"
  #   name      = "LogPublicationControl"
  #   value     = "true"
  # }

  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "DeploymentPolicy"
    value     = "RollingWithAdditionalBatch"
  }
}



# # Elastic Beanstalk Application for Chat Backend Service
# resource "aws_elastic_beanstalk_application" "chat_service" {
#   name        = "peerprep-staging-chat-service"
#   description = "Chat Backend Service"
# }

# resource "aws_elastic_beanstalk_environment" "chat_service" {
#   name                = "peerprep-staging-chat-service"
#   application         = aws_elastic_beanstalk_application.chat_service.name
#   solution_stack_name = "64bit Amazon Linux 2 v4.3.3 running Docker"

#   setting {
#     namespace = "aws:autoscaling:launchconfiguration"
#     name      = "IamInstanceProfile"
#     value     = "aws-elasticbeanstalk-ec2-role"
#   }
#   setting {
#     namespace = "aws:elasticbeanstalk:environment"
#     name      = "ServiceRole"
#     value     = aws_iam_role.eb_service_role.name
#   }

#   # ------------------
#   # Load balancer type
#   # ------------------
#   # application = ALB (recommended); classic = ELB classic; network = NLB
#   setting {
#     namespace = "aws:elasticbeanstalk:environment"
#     name      = "LoadBalancerType"
#     value     = "application"
#   }

#   # ------------------
#   # Capacity / ASG
#   # ------------------
#   setting {
#     namespace = "aws:autoscaling:asg"
#     name      = "MinSize"
#     value     = 1
#   }
#   setting {
#     namespace = "aws:autoscaling:asg"
#     name      = "MaxSize"
#     value     = 2
#   }

#   # ------------------
#   # Health / Proc
#   # ------------------
#   # Healthcheck URL for your container (adjust path)
#   setting {
#     namespace = "aws:elasticbeanstalk:application"
#     name      = "Application Healthcheck URL"
#     value     = "/api/v1/chat-service/health"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:environment:process:default"
#     name      = "Port"
#     value     = 80
#   }
#   setting {
#     namespace = "aws:elasticbeanstalk:environment:process:default"
#     name      = "HealthCheckPath"
#     value     = "/api/v1/chat-service/health"
#   }

#   # ------------------
#   # Deployment settings
#   # ------------------

#   setting {
#     namespace = "aws:elasticbeanstalk:application:environment"
#     name      = "DeploymentPolicy"
#     value     = "Traffic splitting"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:application:environment"
#     name      = "BatchSizeType"
#     value     = "Percentage"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:application:environment"
#     name      = "DeploymentBatchSize"
#     value     = "100"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:application:environment"
#     name      = "TrafficSplit"
#     value     = "100"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:application:environment"
#     name      = "TrafficSplittingEvaluationTime"
#     value     = "5"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:application:environment"
#     name      = "RollingUpdateType"
#     value     = "Rolling based on Health"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:application:environment"
#     name      = "BatchSize"
#     value     = "1"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:application:environment"
#     name      = "MinimumCapacity"
#     value     = "1"
#   }

#   # ------------------
#   # Logs & rolling updates
#   # ------------------
#   setting {
#     namespace = "aws:elasticbeanstalk:hostmanager"
#     name      = "LogPublicationControl"
#     value     = "true"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:command"
#     name      = "DeploymentPolicy"
#     value     = "RollingWithAdditionalBatch"
#   }
# }



# --- Service role ---
resource "aws_iam_role" "eb_service_role" {
  name = "aws-elasticbeanstalk-service-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "elasticbeanstalk.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eb_service_enhanced_health" {
  role       = aws_iam_role.eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}

resource "aws_iam_role_policy_attachment" "eb_service_managed_updates" {
  role       = aws_iam_role.eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy"
}

resource "aws_iam_role" "eb_ec2_role" {
  name = "aws-elasticbeanstalk-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" },
    }]
  })
}

resource "aws_iam_instance_profile" "eb_ec2_instance_profile" {
  name = "aws-elasticbeanstalk-ec2-role"
  role = aws_iam_role.eb_ec2_role.name
}

resource "aws_iam_role_policy_attachment" "eb_multicontainer_docker" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
}

resource "aws_iam_role_policy_attachment" "eb_web_tier" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "eb_worker_tier" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}

resource "aws_iam_role_policy" "secretsmanager_mongodb" {
  name   = "secretsmanager-mongodb"
  role   = aws_iam_role.eb_ec2_role.id
  policy = data.aws_iam_policy_document.secretsmanager_mongodb.json
}

# TODO: Modify account_id in the resource when migrating!
data "aws_iam_policy_document" "secretsmanager_mongodb" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = [
      "arn:aws:secretsmanager:ap-southeast-1:670422575487:secret:*"
    ]
  }
}






resource "aws_cloudfront_distribution" "backend_service" {
  origin {
    domain_name = aws_elastic_beanstalk_environment.collab_service_env.endpoint_url
    origin_id   = "collab-backend-service-origin"
    custom_origin_config {
      # If your EB/ALB terminates TLS and serves HTTPS:
      # origin_protocol_policy = "https-only"
      # If EB is HTTP only behind the ALB, use:
      origin_protocol_policy = "http-only"

      http_port            = 80
      https_port           = 443
      origin_ssl_protocols = ["TLSv1.2"]
    }
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "PeerPrep Backend Staging"

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "collab-backend-service-origin"
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id   = "216adef6-5c7f-47e4-b989-5492eafa07d3"
    response_headers_policy_id = "60669652-455b-4ae9-85a4-c4c02393f86c"
    compress                   = true
  }
  ordered_cache_behavior {
    path_pattern               = "/api/v1/collab-service/*"
    allowed_methods            = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "collab-backend-service-origin"
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id   = "216adef6-5c7f-47e4-b989-5492eafa07d3"
    response_headers_policy_id = "60669652-455b-4ae9-85a4-c4c02393f86c"
    compress                   = true
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    name        = "peerprep-backend-service"
    Environment = "staging"
    Project     = "peerprep"
    Service     = "backend-service"
  }
}

# (Optional) Use AWS default, or create your own Valkey 8 parameter group
# resource "aws_elasticache_parameter_group" "valkey8" {
#   name   = "matching-service-valkey8"
#   family = "valkey8"
# }

resource "aws_elasticache_replication_group" "matching_service" {
  replication_group_id = "matching-service-rg"
  description          = "Matching service cache (Valkey 8)"

  engine         = "valkey"
  engine_version = "8.0"
  # Use AWS default Valkey 8 PG, or point to your custom PG above
  parameter_group_name = "default.valkey8"
  # parameter_group_name        = aws_elasticache_parameter_group.valkey8.name

  node_type = "cache.t3.micro"
  port      = 6379

  # Single-shard, no replicas (equivalent to your previous 1-node cluster)
  num_node_groups            = 1
  replicas_per_node_group    = 0
  automatic_failover_enabled = false # must be false when there are 0 replicas

  # Networking (uncomment / set these if you already have them)
  # subnet_group_name           = aws_elasticache_subnet_group.this.name
  # security_group_ids          = [aws_security_group.cache.id]

  # Snapshots (similar to your previous settings)
  snapshot_retention_limit = 5

  # Encryption (optional—but recommended if your app supports it)
  # at_rest_encryption_enabled  = true
  # transit_encryption_enabled  = true
  # auth_token                  = var.elasticache_auth_token  # if using TLS+AUTH

  tags = {
    Name = "matching-service"
  }
}
