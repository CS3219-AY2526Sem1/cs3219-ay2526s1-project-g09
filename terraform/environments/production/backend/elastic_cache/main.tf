resource "aws_elasticache_replication_group" "matching_service" {
  replication_group_id = "${var.service_name}-cache"
  description          = var.elastic_cache_description

  engine         = "valkey"
  engine_version = "8.0"
  # Use AWS default Valkey 8 PG, or point to your custom PG above
  parameter_group_name = "default.valkey8"
  # parameter_group_name        = aws_elasticache_parameter_group.valkey8.name

  node_type = "cache.t3.micro"
  port      = 6379

  num_node_groups            = 1
  replicas_per_node_group    = 2
  automatic_failover_enabled = true
  multi_az_enabled           = true

  snapshot_retention_limit   = 5
  at_rest_encryption_enabled = true
  transit_encryption_mode    = "preferred"
  transit_encryption_enabled = true
  apply_immediately          = true

  tags = {
    Name = var.service_name
  }
}
