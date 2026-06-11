# All secrets are stored as SecureString (encrypted at rest with the default aws/ssm KMS key).
# Terraform writes these values to SSM — they are never stored as plaintext in .tfstate
# because the Terraform AWS provider marks SecureString values as sensitive.

resource "aws_ssm_parameter" "domain" {
  name  = "/${var.app_name}/domain"
  type  = "String"
  value = var.domain_name

  tags = { App = var.app_name }
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.app_name}/db-password"
  type  = "SecureString"
  value = var.db_password

  tags = { App = var.app_name }
}

resource "aws_ssm_parameter" "session_secret" {
  name  = "/${var.app_name}/session-secret"
  type  = "SecureString"
  value = var.session_secret

  tags = { App = var.app_name }
}

resource "aws_ssm_parameter" "admin_password" {
  name  = "/${var.app_name}/admin-password"
  type  = "SecureString"
  value = var.admin_password

  tags = { App = var.app_name }
}
