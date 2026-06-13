# Latest Ubuntu 22.04 LTS ARM64 AMI (Canonical)
data "aws_ami" "ubuntu_arm64" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-arm64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

resource "aws_key_pair" "app" {
  key_name   = "${var.app_name}-key"
  public_key = var.ssh_public_key
}

resource "aws_instance" "app" {
  ami = data.aws_ami.ubuntu_arm64.id
  # 2 vCPU, 1 GB RAM. Steady-state serving fits comfortably; `next build` peaks
  # above 1 GB and relies on the 2 GB swapfile that user_data.sh creates, plus
  # deploy.sh pausing the app during the build. Bump to t4g.small for faster,
  # swap-free builds if deploy time becomes annoying.
  instance_type          = "t4g.micro"
  key_name               = aws_key_pair.app.key_name
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20 # GB — plenty for OS + Node + PostgreSQL + app
    encrypted             = true
    delete_on_termination = true
  }

  # Passes app_name and aws_region into the bootstrap script via Terraform templatefile.
  # All other secrets are fetched at runtime from SSM Parameter Store.
  user_data = templatefile("${path.module}/scripts/user_data.sh", {
    app_name   = var.app_name
    aws_region = var.aws_region
  })

  # SSM parameters must exist before the instance boots and runs user_data
  depends_on = [
    aws_ssm_parameter.domain,
    aws_ssm_parameter.db_password,
    aws_ssm_parameter.session_secret,
    aws_ssm_parameter.admin_password,
  ]

  tags = { Name = "${var.app_name}-server" }
}

# Static public IP — point your domain's A record here
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = { Name = "${var.app_name}-eip" }
}
