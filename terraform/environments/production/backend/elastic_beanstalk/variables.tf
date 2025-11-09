variable "service_name" {
  description = "The name of the service using the ElastiCache cluster."
  type        = string
}

variable "service_description" {
  description = "The description of the service using the ElastiCache cluster. (e.g. Collab Backend Service)"
  type        = string
}

variable "elastic_beanstalk_service_role_name" {
  description = "The name of the elastic beanstalk service role"
  type        = string
}

variable "environment" {
  description = "The deployment environment (e.g., staging, production)."
  type        = string
}
