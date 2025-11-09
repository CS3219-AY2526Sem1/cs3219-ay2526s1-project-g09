module "ui_shell" {
  source      = "./ui-shell"
  environment = var.environment
}

module "ui" {
  source      = "./ui"
  environment = var.environment
}

module "backend" {
  source      = "./backend"
  account_id  = var.account_id
  environment = var.environment
}

module "github_deployment" {
  source = "../../iam/github-deployment"
}

