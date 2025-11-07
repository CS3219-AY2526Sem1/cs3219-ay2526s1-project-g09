output "elastic_beanstalk_collab_service_url" {
  description = "The URL of the Elastic Beanstalk Collab service."
  value       = aws_elastic_beanstalk_environment.backend_service.endpoint_url
}
