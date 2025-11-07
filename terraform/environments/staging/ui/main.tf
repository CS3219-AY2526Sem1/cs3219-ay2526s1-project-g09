module "collab_ui_service" {
  source       = "./modules"
  bucket_name  = "peerprep-staging-collab-ui"
  environment  = "staging"
  service_name = "collab-ui"
}
