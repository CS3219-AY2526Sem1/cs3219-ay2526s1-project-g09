module "ui_shell" {
  source = "./ui-shell"
}

module "ui" {
  source = "./ui"
}

module "backend" {
  source     = "./backend"
  account_id = 211125712968
}

module "github_deployment" {
  source = "../../iam/github-deployment"
}

