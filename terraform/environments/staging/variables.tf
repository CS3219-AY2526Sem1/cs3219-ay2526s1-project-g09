variable "aws_region" {
  type        = string
  description = "AWS region for this environment"
}

variable "environment" {
  type        = string
  description = "The deployment environment (e.g., staging, production)"
}

variable "account_id" {
  description = "The AWS account ID."
  type        = string
}
