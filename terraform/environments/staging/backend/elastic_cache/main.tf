
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
    Name = var.service_name
  }
}


