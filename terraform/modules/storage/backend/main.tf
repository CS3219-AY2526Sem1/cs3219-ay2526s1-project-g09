resource "aws_cloudfront_distribution" "backend_service" {
  origin {
    domain_name = var.eb_collab_service_url
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
