output "elastic_beanstalk_service_role_name" {
  description = "The name of the Elastic Beanstalk service role"
  value       = aws_iam_role.eb_service_role.name
}
