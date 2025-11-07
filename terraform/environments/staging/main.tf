module "ui_shell" {
  source = "./ui-shell"
}

module "ui" {
  source = "./ui"
}

module "backend" {
  source     = "./backend"
  account_id = 670422575487
}
  
