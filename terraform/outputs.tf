output "elastic_ip" {
  description = "Public IP — point your domain's A record (and www A record) here"
  value       = aws_eip.app.public_ip
}

output "ssh_command" {
  description = "SSH into the server"
  value       = "ssh ubuntu@${aws_eip.app.public_ip}"
}

output "instance_id" {
  description = "EC2 instance ID (useful for SSM Session Manager access)"
  value       = aws_instance.app.id
}

output "ami_id" {
  description = "Ubuntu 22.04 ARM64 AMI used"
  value       = data.aws_ami.ubuntu_arm64.id
}

output "next_steps" {
  description = "What to do after terraform apply"
  value       = <<-EOT

    ── Post-deploy checklist ──────────────────────────────────────────

    1. Wait ~3 min for the bootstrap script to finish, then SSH in:
         ssh ubuntu@${aws_eip.app.public_ip}
       Check bootstrap log: sudo cat /var/log/user_data.log

    2. Clone your repo:
         git clone <your-repo-url> ~/app

    3. (First deploy only) Upload your xlsx if you have data to import:
         scp /path/to/data.xlsx ubuntu@${aws_eip.app.public_ip}:~/app/

    4. Run the deploy script:
         cd ~/app && bash scripts/deploy.sh

    5. Point your domain's A record to: ${aws_eip.app.public_ip}
       (both @ and www → same IP)

    6. After DNS propagates, enable HTTPS:
         sudo certbot --nginx -d ${var.domain_name} -d www.${var.domain_name}

    ──────────────────────────────────────────────────────────────────
  EOT
}
