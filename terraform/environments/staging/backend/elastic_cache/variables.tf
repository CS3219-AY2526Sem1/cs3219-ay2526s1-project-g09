variable "service_name" {
  description = "The name of the service (e.g., collab-service, matching-service)."
  type        = string
}

variable "elastic_cache_description" {
  description = "The description of elastic cache instance. (e.g. Collab Service Cache)"
  type        = string
}
