variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-central-1"
}

variable "app_name" {
  description = "Application name — used as a prefix for all resource names and SSM paths"
  type        = string
  default     = "roulette"
}

variable "ssh_public_key" {
  description = "SSH public key content (paste contents of ~/.ssh/id_ed25519.pub or id_rsa.pub)"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the site, e.g. galas-roulette.com (no trailing slash)"
  type        = string
}

variable "admin_password" {
  description = "Password for the /admin panel"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "iron-session encryption secret — must be at least 32 characters"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.session_secret) >= 32
    error_message = "session_secret must be at least 32 characters long."
  }
}

variable "db_password" {
  description = "PostgreSQL password for the 'roulette' database user (avoid single-quote characters)"
  type        = string
  sensitive   = true
}
