output "elastic_beanstalk_url" {
  description = "The URL of the Elastic Beanstalk service."
  value       = aws_elastic_beanstalk_environment.backend_service.endpoint_url
}
