module "elastic_beanstalk_iam" {
  source     = "../../../iam/elastic_beanstalk"
  account_id = var.account_id
}

module "backend_service_cloudfront" {
  source                = "./cloudfront"
  eb_collab_service_url = module.collab_service_elastic_beanstalk.elastic_beanstalk_collab_service_url
}

module "collab_service_elastic_beanstalk" {
  source                              = "./elastic_beanstalk"
  service_name                        = "collab-service"
  service_description                 = "Collab Backend Service"
  elastic_beanstalk_service_role_name = module.elastic_beanstalk_iam.elastic_beanstalk_service_role_name
}

module "matching_service_elastic_beanstalk" {
  source                              = "./elastic_beanstalk"
  service_name                        = "matching-service"
  service_description                 = "Matching Backend Service"
  elastic_beanstalk_service_role_name = module.elastic_beanstalk_iam.elastic_beanstalk_service_role_name
}

module "matching_service_elastic_cache" {
  source                    = "./elastic_cache"
  service_name              = "matching-service"
  elastic_cache_description = "Matching Service Cache"
}
